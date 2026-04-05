package com.onlinecourse.config;

import com.onlinecourse.entity.User;
import com.onlinecourse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Helper để lấy thông tin User đang đăng nhập từ SecurityContextHolder.
 *
 * Dùng trong các Controller thay thế @RequestHeader("X-User-Id").
 * Spring Security đã đặt Authentication vào SecurityContext
 * thông qua JwtAuthenticationFilter.
 */
@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Trả về UUID của user đang đăng nhập.
     * Dùng khi service chỉ cần userId (phần lớn các trường hợp).
     */
    public UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * Trả về User entity đầy đủ của user đang đăng nhập.
     * Dùng khi cần thêm thông tin ngoài userId.
     */
    public User getCurrentUser() {
        String email = getCurrentEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException(
                        "Không tìm thấy user trong DB dù token hợp lệ: " + email));
    }

    /**
     * Trả về email (username) của user đang đăng nhập.
     */
    public String getCurrentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Không có user nào đang đăng nhập.");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }
        return principal.toString();
    }
}
