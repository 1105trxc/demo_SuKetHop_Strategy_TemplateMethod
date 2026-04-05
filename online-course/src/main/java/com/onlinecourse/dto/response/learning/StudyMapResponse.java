package com.onlinecourse.dto.response.learning;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * Top-level Study Map response returned by GET /api/v1/learning/course/{courseId}.
 */
@Getter
@Builder
public class StudyMapResponse {

    private UUID courseId;
    private String courseTitle;

    /** null when the user is not enrolled */
    private Integer progressPercent;

    private boolean enrolled;

    private List<ChapterStudyResponse> chapters;
}
