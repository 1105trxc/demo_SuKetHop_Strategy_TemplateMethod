package com.onlinecourse.service;

import com.onlinecourse.dto.request.course.LessonCreateRequest;
import com.onlinecourse.dto.response.course.LessonResponse;

public interface LessonService {
    LessonResponse createLesson(LessonCreateRequest request, @org.springframework.lang.NonNull java.util.UUID instructorId);
}
