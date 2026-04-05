package com.onlinecourse.entity;

import com.onlinecourse.entity.enums.OtpType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lưu mã OTP tạm thời cho 2 luồng:
 *  - REGISTER:         Xác thực email khi đăng ký tài khoản mới.
 *  - FORGOT_PASSWORD:  Đặt lại mật khẩu.
 *
 * Mỗi email chỉ nên có 1 OTP còn hiệu lực tại một thời điểm.
 * OTP cũ bị xóa trước khi tạo OTP mới (trong service).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "otp_tokens")
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Email của người dùng cần xác thực. */
    @Column(nullable = false, length = 255)
    private String email;

    /** Mã OTP 6 chữ số dạng String. */
    @Column(name = "otp_code", nullable = false, length = 10)
    private String otpCode;

    /** Thời điểm hết hạn (thường là createdAt + 5 phút). */
    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    /** Phân loại OTP: REGISTER hoặc FORGOT_PASSWORD. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OtpType type;
}
