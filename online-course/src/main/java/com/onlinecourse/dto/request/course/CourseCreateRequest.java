package com.onlinecourse.dto.request.course;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CourseCreateRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 100)
    private String title;

    @NotBlank
    @Size(max = 1000)
    private String description;

    @NotNull
    @Min(value = 0)
    private BigDecimal price;

    @NotNull
    private Integer categoryId;

    @NotBlank
    private String thumbnailUrl;
}
