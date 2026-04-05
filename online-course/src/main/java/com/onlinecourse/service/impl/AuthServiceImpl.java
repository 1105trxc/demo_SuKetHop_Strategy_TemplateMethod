package com.onlinecourse.service.impl;

import com.onlinecourse.config.JwtTokenProvider;
import com.onlinecourse.dto.request.auth.*;
import com.onlinecourse.dto.response.auth.AuthResponse;
import com.onlinecourse.entity.OtpToken;
import com.onlinecourse.entity.Role;
import com.onlinecourse.entity.User;
import com.onlinecourse.entity.enums.OtpType;
import com.onlinecourse.entity.enums.RoleType;
import com.onlinecourse.entity.enums.UserStatus;
import com.onlinecourse.repository.OtpTokenRepository;
import com.onlinecourse.repository.RoleRepository;
import com.onlinecourse.repository.UserRepository;
import com.onlinecourse.service.AuthService;
import com.onlinecourse.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository        userRepository;
    private final RoleRepository        roleRepository;
    private final OtpTokenRepository    otpTokenRepository;
    private final PasswordEncoder       passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider      jwtTokenProvider;
    private final EmailService          emailService;

    @Value("${otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    // ─── 1. Register — Bước 1: Khởi tạo đăng ký ─────────────────────────────

    @Override
    @Transactional
    public String registerInitiate(RegisterRequest request) {

        // Kiểm tra email đã tồn tại và đã ACTIVE chưa
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (existing.getStatus() == UserStatus.ACTIVE) {
                throw new IllegalArgumentException(
                        "Email '" + request.getEmail() + "' đã được đăng ký.");
            }
            // Nếu INACTIVE (đăng ký dở) → xóa để đăng ký lại
            userRepository.delete(existing);
            userRepository.flush(); // Bắt buộc execute DELETE ngay lập tức để tránh trùng UNIQUE constraint khi INSERT bên dưới
        });

        // Lấy role STUDENT
        Role studentRole = roleRepository.findByName(RoleType.ROLE_STUDENT)
                .orElseThrow(() -> new IllegalStateException(
                        "Role ROLE_STUDENT chưa được khởi tạo trong database."));

        // Tạo User với status=INACTIVE (chờ xác thực OTP)
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .status(UserStatus.INACTIVE)
                .build();
        user.addRole(studentRole);
        userRepository.save(user);

        // Sinh và gửi OTP
        String otp = generateOtp();
        saveOtp(request.getEmail(), otp, OtpType.REGISTER);

        String body = EmailServiceImpl.buildRegisterOtpBody(request.getFullName(), otp);
        emailService.sendOtpEmail(
                request.getEmail(), otp,
                "[UTE-Learn] Xác thực tài khoản của bạn", body);

        log.info("[Auth] Gửi OTP đăng ký tới: {}", request.getEmail());
        log.info("MOCK OTP LOG FOR BROWSER AGENT: {}", otp);
        return "Mã xác thực đã được gửi tới " + request.getEmail() + ". Vui lòng kiểm tra hộp thư (và thư mục Spam).";
    }

    // ─── 2. Register — Bước 2: Xác thực OTP ─────────────────────────────────

    @Override
    @Transactional
    public AuthResponse verifyRegisterOtp(VerifyOtpRequest request) {

        OtpToken token = otpTokenRepository
                .findByEmailAndOtpCodeAndType(request.getEmail(), request.getOtp(), OtpType.REGISTER)
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không hợp lệ."));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            otpTokenRepository.delete(token);
            throw new IllegalArgumentException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        // Kích hoạt tài khoản
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("Người dùng không tồn tại."));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        // Xóa OTP đã dùng
        otpTokenRepository.delete(token);

        log.info("[Auth] Xác thực OTP thành công, kích hoạt tài khoản: {}", request.getEmail());

        // Tạo authentication trực tiếp (cần cung cấp UserDetails để JwtTokenProvider ép kiểu)
        var authorities = user.getRoles().stream()
                .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                        role.getName().name()))
                .collect(Collectors.toList());

        org.springframework.security.core.userdetails.UserDetails userDetails = 
                new org.springframework.security.core.userdetails.User(user.getEmail(), "dummyPassword", authorities);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);

        String jwt = jwtTokenProvider.generateToken(auth);

        List<String> roles = authorities.stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .accessToken(jwt)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .build();
    }

    // ─── 3. Login ─────────────────────────────────────────────────────────────

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        log.info("[Auth] Đăng nhập thành công: {}", request.getEmail());

        return AuthResponse.builder()
                .accessToken(jwt)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .build();
    }

    // ─── 4. Forgot Password — Bước 1: Gửi OTP ────────────────────────────────

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy tài khoản với email này."));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Tài khoản chưa được kích hoạt.");
        }

        String otp = generateOtp();
        saveOtp(request.getEmail(), otp, OtpType.FORGOT_PASSWORD);

        String body = EmailServiceImpl.buildForgotPasswordBody(otp);
        emailService.sendOtpEmail(
                request.getEmail(), otp,
                "[UTE-Learn] Đặt lại mật khẩu của bạn", body);

        log.info("[Auth] Gửi OTP quên mật khẩu tới: {}", request.getEmail());
        return "Mã xác thực đã được gửi tới " + request.getEmail() + ". Vui lòng kiểm tra hộp thư.";
    }

    // ─── 5. Reset Password — Bước 2+3: Verify OTP + Đổi pass ─────────────────

    @Override
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {

        var tokenOpt = otpTokenRepository
                .findByEmailAndOtpCodeAndType(request.getEmail(), request.getOtp(), OtpType.FORGOT_PASSWORD);
        if (tokenOpt.isEmpty()) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ.");
        }
        OtpToken token = tokenOpt.get();

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            otpTokenRepository.deleteById(java.util.Objects.requireNonNull(token.getId()));
            throw new IllegalArgumentException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("Người dùng không tồn tại."));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Xóa OTP đã dùng (token không thể null — đã được orElseThrow kiểm tra ở trên)
        otpTokenRepository.deleteById(java.util.Objects.requireNonNull(token.getId()));

        log.info("[Auth] Đặt lại mật khẩu thành công: {}", request.getEmail());
        return "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.";
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /** Sinh mã OTP 6 chữ số ngẫu nhiên an toàn. */
    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000); // [100000, 999999]
        return String.valueOf(code);
    }

    /** Xóa OTP cũ và lưu OTP mới vào DB. */
    private void saveOtp(String email, String otp, OtpType type) {
        otpTokenRepository.deleteByEmailAndType(email, type);
        otpTokenRepository.save(java.util.Objects.requireNonNull(OtpToken.builder()
                .email(email)
                .otpCode(otp)
                .type(type)
                .expiryDate(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .build()));
    }
}
