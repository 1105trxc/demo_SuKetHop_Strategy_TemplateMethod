package com.onlinecourse.controller;

import com.onlinecourse.dto.request.course.ChapterCreateRequest;
import com.onlinecourse.dto.response.course.ChapterResponse;
import com.onlinecourse.service.ChapterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.onlinecourse.config.SecurityUtils;

@RestController
@RequestMapping("/api/v1/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;
    private final SecurityUtils securityUtils;

    /**
     * POST /api/v1/chapters
     * Tạo mới một chương học thuộc một khóa học.
     */
    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ChapterResponse> createChapter(
            @Valid @RequestBody ChapterCreateRequest request
    ) {
        ChapterResponse response = chapterService.createChapter(
                request,
                java.util.Objects.requireNonNull(securityUtils.getCurrentUserId())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
