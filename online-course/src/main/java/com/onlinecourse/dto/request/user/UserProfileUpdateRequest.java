package com.onlinecourse.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileUpdateRequest {
    
    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String phoneNumber;

    private String bio;
}
