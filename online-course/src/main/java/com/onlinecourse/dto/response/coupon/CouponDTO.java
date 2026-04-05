package com.onlinecourse.dto.response.coupon;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponDTO {
    private UUID id;
    private String code;
    private Integer discountPercent;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime expiryDate;
}
