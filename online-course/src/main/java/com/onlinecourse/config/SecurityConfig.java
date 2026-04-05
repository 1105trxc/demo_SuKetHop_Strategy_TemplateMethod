package com.onlinecourse.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security 6 configuration — stateless JWT mode.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;

    // ─── Password Encoder ─────────────────────────────────────────────────────
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ─── Authentication Provider ──────────────────────────────────────────────
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // ─── Authentication Manager ───────────────────────────────────────────────
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ─── Cấu hình CORS Chuẩn cho React (Axios) ────────────────────────────────
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // Quan trọng để Axios đính kèm token/thông tin

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ─── Security Filter Chain ────────────────────────────────────────────────
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthEntryPoint))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Áp dụng cấu hình CORS ở trên
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .authorizeHttpRequests(auth -> auth
                        // --- CỰC KỲ QUAN TRỌNG: Mở cửa cho mọi request OPTIONS dò đường của trình duyệt ---
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // --- PUBLIC ---
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/payments/vnpay-ipn").permitAll()
                        .requestMatchers("/api/v1/payments/vnpay-return").permitAll()
                        .requestMatchers("/api/v1/payments/momo-ipn").permitAll()
                        .requestMatchers("/api/v1/payments/sepay-ipn").permitAll()
                        .requestMatchers("/api/v1/payments/test-config").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/courses/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/learning/courses/*/study-map").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()

                        // --- AUTHENTICATED ---
                        .requestMatchers("/api/v1/users/me/**").authenticated()
                        .requestMatchers("/api/v1/users/me/wishlist/**").authenticated()

                        // --- ROLES CHUYÊN BIỆT ---
                        .requestMatchers(HttpMethod.POST, "/api/v1/instructor-requests").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET,  "/api/v1/instructor-requests/my-status").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.PUT,  "/api/v1/instructor-requests/*/approve").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST,   "/api/v1/courses/**").hasRole("INSTRUCTOR")
                        .requestMatchers(HttpMethod.PUT,    "/api/v1/courses/**").hasRole("INSTRUCTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/courses/**").hasRole("INSTRUCTOR")
                        .requestMatchers(HttpMethod.POST,   "/api/v1/chapters/**").hasRole("INSTRUCTOR")
                        .requestMatchers(HttpMethod.PUT,    "/api/v1/chapters/**").hasRole("INSTRUCTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/chapters/**").hasRole("INSTRUCTOR")
                        .requestMatchers(HttpMethod.POST,   "/api/v1/lessons/**").hasRole("INSTRUCTOR")
                        .requestMatchers(HttpMethod.PUT,    "/api/v1/lessons/**").hasRole("INSTRUCTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/lessons/**").hasRole("INSTRUCTOR")

                        .requestMatchers("/api/v1/files/**").hasRole("INSTRUCTOR")
                        .requestMatchers("/api/v1/learning/lessons/**").hasRole("STUDENT")
                        .requestMatchers("/api/v1/orders/**").hasRole("STUDENT")
                        .requestMatchers("/api/v1/payments/create-url/**").hasRole("STUDENT")
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}