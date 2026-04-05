package com.onlinecourse.service;

import com.onlinecourse.dto.request.auth.*;
import com.onlinecourse.dto.response.auth.AuthResponse;

public interface AuthService {

    /**
     * Bước 1 đăng ký: Tạo User với status=INACTIVE, gửi OTP qua email.
     * @return Message thông báo cho user kiểm tra email.
     */
    String registerInitiate(RegisterRequest request);

    /**
     * Bước 2 đăng ký: Verify OTP → chuyển User sang ACTIVE → trả về JWT.
     */
    AuthResponse verifyRegisterOtp(VerifyOtpRequest request);

    /**
     * Đăng nhập và trả về JWT token nếu xác thực thành công.
     * @throws org.springframework.security.core.AuthenticationException nếu sai email/mật khẩu
     */
    AuthResponse login(LoginRequest request);

    /**
     * Bước 1 quên mật khẩu: Kiểm tra email tồn tại → gửi OTP FORGOT_PASSWORD.
     */
    String forgotPassword(ForgotPasswordRequest request);

    /**
     * Bước 2+3 quên mật khẩu: Verify OTP → đổi mật khẩu mới → xóa OTP.
     */
    String resetPassword(ResetPasswordRequest request);
}
