package com.onlinecourse.service.impl;

import com.onlinecourse.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * Gửi email HTML qua Gmail SMTP (cấu hình trong application.yml).
 * Method được đánh dấu @Async để không block thread xử lý request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    @Async
    public void sendOtpEmail(String to, String otp, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("ducduydinh4805nt@gmail.com", "UTE-Learn");
            helper.setTo(Objects.requireNonNull(to));
            helper.setSubject(Objects.requireNonNull(subject));
            helper.setText(Objects.requireNonNull(body), true); // true = HTML

            mailSender.send(message);
            log.info("[Email] Đã gửi OTP tới: {}", to);

        } catch (Exception e) {
            log.error("[Email] Lỗi khi gửi email tới {}: {}", to, e.getMessage());
            // Không ném exception để tránh roll back transaction
        }
    }

    // ─── Static HTML template builders ───────────────────────────────────────

    /**
     * Template email OTP đăng ký tài khoản.
     */
    public static String buildRegisterOtpBody(String fullName, String otp) {
        return """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8faff;border-radius:16px;overflow:hidden;border:1px solid #e4e8f0">
              <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800">📚 UTE-Learn</h1>
              </div>
              <div style="padding:32px">
                <h2 style="color:#1e293b;font-size:20px;margin-bottom:8px">Xin chào, %s!</h2>
                <p style="color:#64748b;font-size:15px;line-height:1.6;margin-bottom:24px">
                  Cảm ơn bạn đã đăng ký tài khoản tại <strong>UTE-Learn</strong>.<br>
                  Nhập mã xác thực bên dưới để hoàn tất đăng ký.
                </p>
                <div style="background:#4f46e5;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                  <span style="color:#fff;font-size:36px;font-weight:900;letter-spacing:10px;font-family:monospace">%s</span>
                </div>
                <p style="color:#94a3b8;font-size:13px;text-align:center">
                  ⏰ Mã có hiệu lực trong <strong>5 phút</strong>.<br>
                  Nếu bạn không yêu cầu, hãy bỏ qua email này.
                </p>
              </div>
              <div style="background:#f1f5f9;padding:16px;text-align:center">
                <p style="color:#94a3b8;font-size:12px;margin:0">© 2025 UTE-Learn. All rights reserved.</p>
              </div>
            </div>
            """.formatted(fullName, otp);
    }

    /**
     * Template email OTP quên mật khẩu.
     */
    public static String buildForgotPasswordBody(String otp) {
        return """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8faff;border-radius:16px;overflow:hidden;border:1px solid #e4e8f0">
              <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800">📚 UTE-Learn</h1>
              </div>
              <div style="padding:32px">
                <h2 style="color:#1e293b;font-size:20px;margin-bottom:8px">🔐 Đặt lại mật khẩu</h2>
                <p style="color:#64748b;font-size:15px;line-height:1.6;margin-bottom:24px">
                  Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.<br>
                  Nhập mã xác thực bên dưới để tiếp tục.
                </p>
                <div style="background:#dc2626;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                  <span style="color:#fff;font-size:36px;font-weight:900;letter-spacing:10px;font-family:monospace">%s</span>
                </div>
                <p style="color:#94a3b8;font-size:13px;text-align:center">
                  ⏰ Mã có hiệu lực trong <strong>5 phút</strong>.<br>
                  Nếu bạn không yêu cầu, hãy bảo mật tài khoản ngay.
                </p>
              </div>
              <div style="background:#f1f5f9;padding:16px;text-align:center">
                <p style="color:#94a3b8;font-size:12px;margin:0">© 2025 UTE-Learn. All rights reserved.</p>
              </div>
            </div>
            """.formatted(otp);
    }
}
