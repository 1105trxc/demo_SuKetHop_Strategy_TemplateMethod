package com.onlinecourse.controller;

import com.onlinecourse.config.SecurityUtils;
import com.onlinecourse.dto.request.learning.LearningProgressRequest;
import com.onlinecourse.dto.response.learning.LessonContentResponse;
import com.onlinecourse.dto.response.learning.StudyMapResponse;
import com.onlinecourse.service.LearningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;
    private final SecurityUtils   securityUtils;

    // ─── 1. Study Map ─────────────────────────────────────────────────────────

    /**
     * GET /api/v1/learning/courses/{courseId}/study-map
     *
     * PUBLIC endpoint — ai cũng xem được (kể cả chưa đăng nhập).
     * - User đã enrolled  → tất cả bài học mở + dữ liệu tiến độ.
     * - User chưa enrolled → chỉ bài isFreePreview mở, còn lại isLocked = true.
     *
     * Khi user chưa đăng nhập, userId = null → service tự xử lý "chưa enrolled".
     */
    @GetMapping("/courses/{courseId}/study-map")
    public ResponseEntity<StudyMapResponse> getStudyMap(
            @PathVariable UUID courseId
    ) {
        // Nếu chưa đăng nhập (anonymous request) thì userId = null
        UUID userId = tryGetCurrentUserId();
        return ResponseEntity.ok(learningService.getStudyMap(courseId, userId));
    }

    // ─── 2. Lesson Detail ─────────────────────────────────────────────────────

    /**
     * GET /api/v1/learning/lessons/{lessonId}
     *
     * Bảo vệ bởi ROLE_STUDENT (hoặc lesson là isFreePreview — kiểm tra trong service).
     * userId lấy tự động từ JWT.
     */
    @GetMapping("/lessons/{lessonId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<LessonContentResponse> getLessonContent(
            @PathVariable UUID lessonId
    ) {
        return ResponseEntity.ok(
                learningService.getLessonContent(lessonId, securityUtils.getCurrentUserId()));
    }

    // ─── 3. Update Progress ───────────────────────────────────────────────────

    /**
     * PATCH /api/v1/learning/lessons/{lessonId}/progress
     *
     * Cập nhật lastWatchedSecond + status. Yêu cầu ROLE_STUDENT.
     * userId lấy tự động từ JWT.
     */
    @PatchMapping("/lessons/{lessonId}/progress")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> updateProgress(
            @PathVariable UUID lessonId,
            @Valid @RequestBody LearningProgressRequest request
    ) {
        learningService.updateProgress(
                lessonId,
                securityUtils.getCurrentUserId(),
                request);
        return ResponseEntity.noContent().build();
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    /**
     * Trả về userId nếu đã đăng nhập, null nếu là anonymous user.
     * Dùng cho endpoint public (study-map) để phân biệt enrolled/non-enrolled.
     */
    private UUID tryGetCurrentUserId() {
        try {
            return securityUtils.getCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }
}
