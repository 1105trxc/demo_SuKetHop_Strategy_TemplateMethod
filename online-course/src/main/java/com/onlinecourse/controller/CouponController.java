package com.onlinecourse.controller;

import com.onlinecourse.dto.response.coupon.CouponDTO;
import com.onlinecourse.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateCoupon(@RequestParam String code) {
        Map<String, Object> response = new HashMap<>();
        try {
            CouponDTO coupon = couponService.validateCoupon(code);
            response.put("code", 200);
            response.put("message", "Áp dụng mã giảm giá thành công");
            response.put("data", coupon);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("code", 400);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
