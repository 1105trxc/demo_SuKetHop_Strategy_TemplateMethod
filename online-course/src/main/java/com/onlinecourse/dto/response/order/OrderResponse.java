package com.onlinecourse.dto.response.order;

import com.onlinecourse.entity.enums.OrderStatus;
import com.onlinecourse.entity.enums.PaymentMethod;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class OrderResponse {
    private UUID id;
    private BigDecimal totalPrice;
    private BigDecimal finalPrice;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private String paymentUrl;
    private LocalDateTime createdAt;          // từ BaseEntity
    private List<OrderItemResponse> items;    // danh sách khóa học trong đơn
}
