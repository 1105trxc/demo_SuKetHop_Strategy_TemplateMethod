package com.onlinecourse.dto.response.learning;

import com.onlinecourse.entity.enums.LearningStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/**
 * Represents a single lesson row inside the Study Map.
 * videoUrl and isLocked are controlled by enrollment/preview rules.
 */
@Getter
@Builder
public class LessonProgressResponse {

    private UUID lessonId;
    private String title;
    private Integer durationSeconds;
    private Integer orderIndex;
    private Boolean isFreePreview;

    // null when locked (non-enrolled, non-preview)
    private String videoUrl;

    // enriched from LearningProgress if enrolled
    private LearningStatus status;
    private Integer lastWatchedSecond;

    // true when video is hidden from unenrolled users
    private Boolean isLocked;
}
