package com.onlinecourse.dto.response.course;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class LessonResponse {
    private UUID id;
    private String title;
    private String videoUrl;
    private Integer durationSeconds;
    private Integer orderIndex;
    private Boolean isFreePreview;
}
