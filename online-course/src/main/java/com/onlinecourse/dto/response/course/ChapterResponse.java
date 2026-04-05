package com.onlinecourse.dto.response.course;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ChapterResponse {
    private UUID id;
    private String title;
    private Integer orderIndex;
    private List<LessonResponse> lessons;
}
