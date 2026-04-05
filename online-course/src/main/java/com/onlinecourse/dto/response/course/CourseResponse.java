package com.onlinecourse.dto.response.course;

import com.onlinecourse.entity.enums.CourseStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class CourseResponse {
    private UUID id;
    private String title;
    private String description;
    private BigDecimal price;
    private String thumbnailUrl;
    private CourseStatus status;
    private String instructorName;
    private String categoryName;
    private String rejectReason;
    private List<ChapterResponse> chapters;
}
