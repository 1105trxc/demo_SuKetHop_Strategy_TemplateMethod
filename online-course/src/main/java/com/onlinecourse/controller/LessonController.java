package com.onlinecourse.controller;

import com.onlinecourse.dto.request.course.LessonCreateRequest;
import com.onlinecourse.dto.response.course.LessonResponse;
import com.onlinecourse.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.onlinecourse.config.SecurityUtils;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;
    private final SecurityUtils securityUtils;

    /**
     * POST /api/v1/lessons
     * Tạo mới một bài học thuộc một chương học.
     */
    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<LessonResponse> createLesson(
            @Valid @RequestBody LessonCreateRequest request
    ) {
        LessonResponse response = lessonService.createLesson(
                request,
                java.util.Objects.requireNonNull(securityUtils.getCurrentUserId())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
