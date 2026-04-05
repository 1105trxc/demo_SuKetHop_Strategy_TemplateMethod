package com.onlinecourse.service;

public interface EmailService {

    /**
     * Gửi email chứa mã OTP đến địa chỉ email người dùng.
     *
     * @param to      Địa chỉ nhận
     * @param otp     Mã OTP 6 số
     * @param subject Tiêu đề email
     * @param body    Nội dung HTML của email
     */
    void sendOtpEmail(String to, String otp, String subject, String body);
}
