package com.onlinecourse.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorRegisterReq {

    @NotBlank(message = "Chuyên môn không được để trống")
    private String expertise;

    private String portfolioUrl;

    @NotBlank(message = "Link CV không được để trống")
    private String cvFileUrl;
}