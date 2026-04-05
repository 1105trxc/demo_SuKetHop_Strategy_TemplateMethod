package com.onlinecourse.service;

import com.onlinecourse.dto.response.coupon.CouponDTO;

public interface CouponService {
    CouponDTO validateCoupon(String code);
}
