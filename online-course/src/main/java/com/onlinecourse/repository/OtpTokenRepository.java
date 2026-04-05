package com.onlinecourse.repository;

import com.onlinecourse.entity.OtpToken;
import com.onlinecourse.entity.enums.OtpType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    /**
     * Tìm OTP hợp lệ theo email + mã + loại.
     * Dùng trong quá trình verify OTP.
     */
    Optional<OtpToken> findByEmailAndOtpCodeAndType(String email, String otpCode, OtpType type);

    /**
     * Xóa toàn bộ OTP cũ của email (theo loại) trước khi tạo OTP mới.
     * Đảm bảo mỗi email chỉ có 1 OTP active.
     */
    void deleteByEmailAndType(String email, OtpType type);

    /**
     * Kiểm tra xem email có OTP còn hiệu lực không (chống spam gửi lại liên tục).
     */
    boolean existsByEmailAndTypeAndExpiryDateAfter(String email, OtpType type, LocalDateTime now);
}
