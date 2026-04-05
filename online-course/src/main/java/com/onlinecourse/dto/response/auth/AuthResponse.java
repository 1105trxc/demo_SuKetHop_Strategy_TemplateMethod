package com.onlinecourse.dto.response.auth;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * Trả về sau khi login thành công.
 * Frontend lưu accessToken vào localStorage và gửi kèm mọi request sau đó
 * trong header: Authorization: Bearer <accessToken>
 */
@Getter
@Builder
public class AuthResponse {

    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private UUID userId;
    private String email;
    private String fullName;
    private List<String> roles;
}
