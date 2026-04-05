package com.onlinecourse.dto.response.learning;

import com.onlinecourse.entity.enums.LearningStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/**
 * Returned by GET /api/v1/learning/lesson/{lessonId}.
 * Contains the actual videoUrl (only if access is granted) and current progress.
 */
@Getter
@Builder
public class LessonContentResponse {

    private UUID lessonId;
    private String title;
    private String videoUrl;
    private Integer durationSeconds;
    private Boolean isFreePreview;

    // progress fields (null if first time watching)
    private LearningStatus status;
    private Integer lastWatchedSecond;
}
