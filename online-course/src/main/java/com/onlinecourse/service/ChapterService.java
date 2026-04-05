package com.onlinecourse.service;

import com.onlinecourse.dto.request.course.ChapterCreateRequest;
import com.onlinecourse.dto.response.course.ChapterResponse;

public interface ChapterService {
    ChapterResponse createChapter(ChapterCreateRequest request, @org.springframework.lang.NonNull java.util.UUID instructorId);
}
