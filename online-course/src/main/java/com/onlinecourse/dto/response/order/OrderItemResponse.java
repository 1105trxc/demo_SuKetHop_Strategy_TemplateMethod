package com.onlinecourse.dto.response.order;

import com.onlinecourse.entity.enums.RequestStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class OrderItemResponse {
    private UUID id;
    private UUID courseId;
    private String courseTitle;
    private String courseThumbnailUrl;
    private BigDecimal priceAtPurchase;
    private RequestStatus refundStatus; // null nếu chưa có yêu cầu hoàn tiền
}
