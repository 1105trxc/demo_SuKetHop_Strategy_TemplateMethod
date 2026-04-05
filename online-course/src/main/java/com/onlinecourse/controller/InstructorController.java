package com.onlinecourse.controller;

import com.onlinecourse.config.SecurityUtils;
import com.onlinecourse.entity.Course;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.OrderItem;
import com.onlinecourse.entity.enums.CourseStatus;
import com.onlinecourse.entity.enums.OrderStatus;

import com.onlinecourse.repository.CourseRepository;
import com.onlinecourse.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/instructor")
@RequiredArgsConstructor
public class InstructorController {

    private final CourseRepository courseRepository;
    private final OrderRepository orderRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getStats() {
        UUID instructorId = Objects.requireNonNull(securityUtils.getCurrentUserId());

        List<Course> courses = courseRepository.findByInstructorId(instructorId);

        long totalCourses = courses.size();
        long publishedCourses = courses.stream().filter(c -> c.getStatus() == CourseStatus.PUBLISHED).count();
        long pendingCourses = courses.stream().filter(c -> c.getStatus() == CourseStatus.PENDING_APPROVAL).count();

        // Lấy tất cả OrderItems liên quan đến các khóa học này để tính doanh thu & học viên
        // Tạm thời fetch tất cả Order đã completed/paid và filter
        List<Order> allOrders = orderRepository.findAll(); // TODO: tối ưu bằng quy vấn Custom
        
        BigDecimal totalRevenue = BigDecimal.ZERO;
        Set<UUID> uniqueStudents = new HashSet<>();
        long totalEnrollments = 0;

        for (Order order : allOrders) {
            if (order.getStatus() == OrderStatus.PAID) {
                for (OrderItem item : order.getOrderItems()) {
                    boolean isMine = courses.stream().anyMatch(c -> c.getId().equals(item.getCourse().getId()));
                    if (isMine) {
                        // Tính tổng revenue
                        // Simplification for stats: assumed not refunded if logic not fully built around it
                        totalRevenue = totalRevenue.add(item.getPriceAtPurchase());
                        uniqueStudents.add(order.getUser().getId());
                        totalEnrollments++;
                    }
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCourses", totalCourses);
        stats.put("publishedCourses", publishedCourses);
        stats.put("pendingCourses", pendingCourses);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalStudents", uniqueStudents.size());
        stats.put("totalEnrollments", totalEnrollments);

        return ResponseEntity.ok(stats);
    }
}
