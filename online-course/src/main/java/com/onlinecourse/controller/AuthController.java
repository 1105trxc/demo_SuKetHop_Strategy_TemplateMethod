package com.onlinecourse.controller;

import com.onlinecourse.dto.request.auth.*;
import com.onlinecourse.dto.response.auth.AuthResponse;
import com.onlinecourse.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/register
     *
     * Bước 1 đăng ký: Tạo User INACTIVE + gửi OTP qua email.
     * Trả về message hướng dẫn user kiểm tra email.
     * Body: { "email", "password", "fullName" }
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        String message = authService.registerInitiate(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * POST /api/v1/auth/verify-register-otp
     *
     * Bước 2 đăng ký: Xác thực OTP → kích hoạt User ACTIVE → trả về JWT.
     * Body: { "email", "otp" }
     */
    @PostMapping("/verify-register-otp")
    public ResponseEntity<AuthResponse> verifyRegisterOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        AuthResponse response = authService.verifyRegisterOtp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/login
     *
     * Đăng nhập và nhận JWT token.
     * Body: { "email", "password" }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/forgot-password
     *
     * Bước 1 quên mật khẩu: Gửi OTP reset về email.
     * Body: { "email" }
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * POST /api/v1/auth/reset-password
     *
     * Bước 2+3 quên mật khẩu: Verify OTP + đặt mật khẩu mới.
     * Body: { "email", "otp", "newPassword" }
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", message));
    }
}
