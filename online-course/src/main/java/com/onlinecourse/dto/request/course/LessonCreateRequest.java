package com.onlinecourse.dto.request.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class LessonCreateRequest {
    @NotNull
    private UUID chapterId;

    @NotBlank
    private String title;

    @NotBlank
    private String videoUrl;

    @NotNull
    private Integer durationSeconds;

    @NotNull
    private Integer orderIndex;

    private Boolean isFreePreview = false;
}
