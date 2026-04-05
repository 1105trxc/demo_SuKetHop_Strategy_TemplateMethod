package com.onlinecourse.service;

import com.onlinecourse.dto.request.order.OrderCreateRequest;
import com.onlinecourse.dto.response.order.OrderResponse;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.UUID;

public interface OrderService {
    OrderResponse createOrder(OrderCreateRequest request, @NonNull UUID userId);
    List<OrderResponse> getMyOrders(@NonNull UUID userId);
    OrderResponse getOrderById(UUID orderId, @NonNull UUID userId);
}
