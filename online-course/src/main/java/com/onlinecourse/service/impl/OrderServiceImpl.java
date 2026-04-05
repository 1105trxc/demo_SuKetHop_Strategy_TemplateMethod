package com.onlinecourse.service.impl;

import com.onlinecourse.dto.request.order.OrderCreateRequest;
import com.onlinecourse.dto.response.order.OrderResponse;
import com.onlinecourse.entity.Course;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.OrderItem;
import com.onlinecourse.entity.User;
import com.onlinecourse.entity.enums.CourseStatus;
import com.onlinecourse.entity.enums.OrderStatus;
import com.onlinecourse.entity.enums.RequestStatus;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.mapper.OrderMapper;
import com.onlinecourse.repository.CourseRepository;
import com.onlinecourse.repository.EnrollmentRepository;
import com.onlinecourse.repository.OrderRepository;
import com.onlinecourse.repository.RefundRequestRepository;
import com.onlinecourse.repository.UserRepository;
import com.onlinecourse.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final com.onlinecourse.repository.CouponRepository couponRepository;
    private final OrderMapper orderMapper;

    @Override
    @Transactional
    public OrderResponse createOrder(OrderCreateRequest request, @NonNull UUID userId) {
        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại!"));

        if (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) {
            throw new IllegalStateException("PHONE_REQUIRED: Vui lòng cập nhật số điện thoại trước khi đặt hàng.");
        }

        List<Course> courses = courseRepository.findAllById(
                Objects.requireNonNull(request.getCourseIds(), "Course IDs must not be null"));

        if (courses.size() != request.getCourseIds().size()) {
            throw new IllegalArgumentException("Một số khóa học không tồn tại trong hệ thống!");
        }

        List<String> alreadyEnrolled = new ArrayList<>();
        List<String> unpublishedTitles = new ArrayList<>();

        for (Course course : courses) {
            if (enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
                alreadyEnrolled.add(course.getTitle());
            }
            if (course.getStatus() != CourseStatus.PUBLISHED) {
                unpublishedTitles.add(course.getTitle());
            }
        }

        if (!alreadyEnrolled.isEmpty()) {
            throw new IllegalArgumentException(
                    "ALREADY_ENROLLED: Bạn đã sở hữu khóa học: " + String.join(", ", alreadyEnrolled)
                            + ". Vui lòng xóa khỏi giỏ hàng.");
        }

        if (!unpublishedTitles.isEmpty()) {
            throw new IllegalStateException(
                    "COURSE_UNAVAILABLE: Khóa học sau không còn mở bán: "
                            + String.join(", ", unpublishedTitles));
        }

        BigDecimal totalPrice = courses.stream()
                .map(Course::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal finalPrice = totalPrice;
        com.onlinecourse.entity.Coupon appliedCoupon = null;

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            appliedCoupon = couponRepository.findByCode(request.getCouponCode())
                    .orElseThrow(() -> new IllegalArgumentException("Mã giảm giá không tồn tại!"));
            if (appliedCoupon.getExpiryDate() != null && appliedCoupon.getExpiryDate().isBefore(java.time.LocalDateTime.now())) {
                throw new IllegalArgumentException("Mã giảm giá đã hết hạn!");
            }
            if (totalPrice.compareTo(BigDecimal.ZERO) > 0 && appliedCoupon.getDiscountPercent() != null) {
                BigDecimal discount = totalPrice.multiply(BigDecimal.valueOf(appliedCoupon.getDiscountPercent())).divide(BigDecimal.valueOf(100));
                if (appliedCoupon.getMaxDiscountAmount() != null && discount.compareTo(appliedCoupon.getMaxDiscountAmount()) > 0) {
                    discount = appliedCoupon.getMaxDiscountAmount();
                }
                finalPrice = totalPrice.subtract(discount);
                if (finalPrice.compareTo(BigDecimal.ZERO) < 0) {
                    finalPrice = BigDecimal.ZERO;
                }
            }
        }

        // --- Dọn dẹp: Hủy tất cả các Order PENDING trước đó của User này ---
        List<Order> pendingOrders = orderRepository.findByUserIdAndStatus(userId, OrderStatus.PENDING);
        for (Order pOrder : pendingOrders) {
            pOrder.setStatus(OrderStatus.CANCELLED);
        }
        if (!pendingOrders.isEmpty()) {
            orderRepository.saveAll(pendingOrders);
        }
        // -------------------------------------------------------------------

        Order order = orderMapper.toOrder(request);
        order.setUser(user);
        if (appliedCoupon != null) {
            order.setCoupon(appliedCoupon);
        }
        order.setTotalPrice(totalPrice);
        order.setFinalPrice(finalPrice);
        order.setStatus(OrderStatus.PENDING);

        for (Course course : courses) {
            OrderItem item = OrderItem.builder()
                    .course(course)
                    .priceAtPurchase(course.getPrice())
                    .build();
            order.addOrderItem(item);
        }

        Order savedOrder = orderRepository.save(order);
        return orderMapper.toOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(@NonNull UUID userId) {
        // Retrieve orders for the user
        List<Order> orders = orderRepository.findByUserId(Objects.requireNonNull(userId));
        
        List<com.onlinecourse.entity.RefundRequest> refunds = refundRequestRepository.findByUserId(userId);
        Map<UUID, RequestStatus> refundMap = new HashMap<>();
        for (com.onlinecourse.entity.RefundRequest r : refunds) {
            refundMap.put(r.getOrderItem().getId(), r.getStatus());
        }

        return orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .map(order -> mapToResponseWithItems(order, refundMap))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId, @NonNull UUID userId) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại!"));

        if (!order.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Đơn hàng không tồn tại!");
        }

        List<com.onlinecourse.entity.RefundRequest> refunds = refundRequestRepository.findByUserId(userId);
        Map<UUID, RequestStatus> refundMap = new HashMap<>();
        for (com.onlinecourse.entity.RefundRequest r : refunds) {
            refundMap.put(r.getOrderItem().getId(), r.getStatus());
        }

        return mapToResponseWithItems(order, refundMap);
    }

    private OrderResponse mapToResponseWithItems(Order order, Map<UUID, RequestStatus> refundMap) {
        OrderResponse response = orderMapper.toOrderResponse(order);
        response.setCreatedAt(order.getCreatedAt());
        
        List<com.onlinecourse.dto.response.order.OrderItemResponse> itemResponses = new ArrayList<>();
        for (OrderItem item : order.getOrderItems()) {
            com.onlinecourse.dto.response.order.OrderItemResponse itemRes = new com.onlinecourse.dto.response.order.OrderItemResponse();
            itemRes.setId(item.getId());
            itemRes.setCourseId(item.getCourse().getId());
            itemRes.setCourseTitle(item.getCourse().getTitle());
            itemRes.setCourseThumbnailUrl(item.getCourse().getThumbnailUrl());
            itemRes.setPriceAtPurchase(item.getPriceAtPurchase());
            itemRes.setRefundStatus(refundMap.get(item.getId()));
            itemResponses.add(itemRes);
        }
        response.setItems(itemResponses);
        return response;
    }
}
