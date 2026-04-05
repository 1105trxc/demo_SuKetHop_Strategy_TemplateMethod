package com.onlinecourse.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Tiện ích JWT: sinh token khi login và validate token khi có request gửi lên.
 *
 * Sử dụng JJWT 0.12.x với thuật toán HS256 (HMAC-SHA256).
 * Secret key phải >= 256 bits — được đọc từ application.yml.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs
    ) {
        // Decode base64 → build HMAC-SHA key (JJWT 0.12.x API)
        this.secretKey   = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMs = expirationMs;
    }

    // ─── Generate Token ───────────────────────────────────────────────────────

    /**
     * Sinh JWT token sau khi xác thực thành công.
     * Claims chứa: sub (email), roles (list), iat, exp.
     */
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        Date now    = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userDetails.getUsername())   // email
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)                  // defaults to HS256
                .compact();
    }

    // ─── Extract Claims ───────────────────────────────────────────────────────

    /** Lấy email (subject) từ token. */
    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    // ─── Validate Token ───────────────────────────────────────────────────────

    /**
     * Trả về true nếu token hợp lệ (chữ ký đúng và chưa hết hạn).
     * Log lỗi cụ thể để debugging dễ hơn.
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("[JWT] Token hết hạn: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("[JWT] Token không được hỗ trợ: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("[JWT] Token không hợp lệ (malformed): {}", e.getMessage());
        } catch (SecurityException e) {
            log.warn("[JWT] Chữ ký JWT không hợp lệ: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("[JWT] Token rỗng hoặc null: {}", e.getMessage());
        }
        return false;
    }

    // ─── Private helper ───────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
