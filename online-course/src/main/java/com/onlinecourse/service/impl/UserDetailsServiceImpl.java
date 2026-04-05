package com.onlinecourse.service.impl;

import com.onlinecourse.entity.User;
import com.onlinecourse.entity.enums.UserStatus;
import com.onlinecourse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

/**
 * Bridge giữa Spring Security và database của ứng dụng.
 *
 * Spring Security gọi loadUserByUsername(email) khi xác thực:
 *  1. Trong AuthenticationManager (lúc login).
 *  2. Trong JwtAuthenticationFilter (mỗi request có Bearer token).
 *
 * JOIN FETCH roles để tránh LazyInitializationException khi build authorities.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy tài khoản với email: " + email));

        // Chặn user chưa xác thực OTP đăng nhập
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new DisabledException(
                    "Tài khoản chưa được xác thực. Vui lòng kiểm tra email và nhập mã OTP.");
        }

        // Chặn user bị ban
        if (user.getStatus() == UserStatus.BANNED) {
            throw new DisabledException("Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.");
        }

        // Chuyển Role entity → SimpleGrantedAuthority ("ROLE_STUDENT", "ROLE_INSTRUCTOR", ...)
        var authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toSet());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }
}
