package com.onlinecourse.service.impl;

import com.onlinecourse.dto.response.coupon.CouponDTO;
import com.onlinecourse.entity.Coupon;
import com.onlinecourse.repository.CouponRepository;
import com.onlinecourse.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    public CouponDTO validateCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Mã giảm giá không tồn tại!"));

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã giảm giá đã hết hạn!");
        }

        return CouponDTO.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountPercent(coupon.getDiscountPercent())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .expiryDate(coupon.getExpiryDate())
                .build();
    }
}
