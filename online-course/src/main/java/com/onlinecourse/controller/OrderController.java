package com.onlinecourse.controller;

import com.onlinecourse.config.SecurityUtils;
import com.onlinecourse.dto.request.order.OrderCreateRequest;
import com.onlinecourse.dto.response.order.OrderResponse;
import com.onlinecourse.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final SecurityUtils securityUtils;

    /** POST — Tạo đơn hàng mới (STUDENT only). */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody OrderCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(request, Objects.requireNonNull(securityUtils.getCurrentUserId())));
    }

    /** GET /my-orders — Lịch sử đơn hàng của user hiện tại (STUDENT only). */
    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        return ResponseEntity.ok(
                orderService.getMyOrders(Objects.requireNonNull(securityUtils.getCurrentUserId())));
    }

    /** GET /{id} — Chi tiết đơn hàng (chủ sở hữu). */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(
                orderService.getOrderById(id, Objects.requireNonNull(securityUtils.getCurrentUserId())));
    }
}
