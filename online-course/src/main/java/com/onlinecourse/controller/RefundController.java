package com.onlinecourse.controller;

import com.onlinecourse.config.SecurityUtils;
import com.onlinecourse.dto.request.order.RefundRequestDto;
import com.onlinecourse.entity.OrderItem;
import com.onlinecourse.entity.RefundRequest;
import com.onlinecourse.entity.User;
import com.onlinecourse.entity.enums.RequestStatus;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.repository.OrderItemRepository;
import com.onlinecourse.repository.RefundRequestRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;


@RestController
@RequestMapping("/api/v1/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final SecurityUtils securityUtils;
    private final RefundRequestRepository refundRequestRepository;
    private final OrderItemRepository orderItemRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<Map<String, String>> requestRefund(
            @Valid @RequestBody RefundRequestDto dto
    ) {
        User user = securityUtils.getCurrentUser();

        OrderItem item = orderItemRepository.findById(Objects.requireNonNull(dto.getOrderItemId()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục đơn hàng!"));

        // Xác thực order thuộc về user này
        if (!item.getOrder().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Không tìm thấy mục đơn hàng trong đơn hàng của bạn!");
        }

        // Kiểm tra đã yêu cầu hoàn tiền chưa
        boolean alreadyRequested = refundRequestRepository.findByUserId(user.getId()).stream()
                .anyMatch(r -> r.getOrderItem().getId().equals(item.getId()));

        if (alreadyRequested) {
            throw new IllegalStateException("Bạn đã yêu cầu hoàn tiền cho khóa học này rồi!");
        }

        RefundRequest request = RefundRequest.builder()
                .user(user)
                .orderItem(item)
                .reason(dto.getReason())
                .status(RequestStatus.PENDING)
                .build();

        refundRequestRepository.save(java.util.Objects.requireNonNull(request));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Yêu cầu hoàn tiền đã được gửi thành công."));
    }
}
