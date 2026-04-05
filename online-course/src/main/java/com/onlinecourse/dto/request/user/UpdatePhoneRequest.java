package com.onlinecourse.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Request body cho PUT /api/v1/users/me/phone
 */
@Getter
@Setter
public class UpdatePhoneRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(min = 9, max = 15, message = "Số điện thoại từ 9-15 ký tự")
    @Pattern(regexp = "^[0-9+\\-\\s()]+$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;
}
