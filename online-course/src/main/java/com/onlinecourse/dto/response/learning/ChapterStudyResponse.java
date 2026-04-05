package com.onlinecourse.dto.response.learning;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * A chapter row inside the Study Map, carrying its list of lesson progress rows.
 */
@Getter
@Builder
public class ChapterStudyResponse {

    private UUID chapterId;
    private String title;
    private Integer orderIndex;
    private List<LessonProgressResponse> lessons;
}
