package com.onlinecourse.dto.request.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ChapterCreateRequest {
    @NotNull
    private UUID courseId;

    @NotBlank
    private String title;

    @NotNull
    private Integer orderIndex;
}
