package com.onlinecourse.service;

import com.onlinecourse.dto.request.learning.LearningProgressRequest;
import com.onlinecourse.dto.response.learning.LessonContentResponse;
import com.onlinecourse.dto.response.learning.StudyMapResponse;

import java.util.UUID;

public interface LearningService {

    /**
     * Trả về bản đồ học tập (chapters + lessons + tiến độ) cho khóa học.
     *
     * - User đã enrolled  → tất cả bài học mở, kèm dữ liệu LearningProgress.
     * - User chưa enrolled → bài isFreePreview mở; còn lại isLocked = true, videoUrl = null.
     *
     * @param courseId ID khóa học cần lấy study map
     * @param userId   ID user đang yêu cầu (có thể đã hoặc chưa enrolled)
     */
    StudyMapResponse getStudyMap(UUID courseId, UUID userId);

    /**
     * Trả về chi tiết bài học kèm videoUrl nếu user có quyền truy cập.
     *
     * Quyền truy cập: isFreePreview == true HOẶC user đã enrolled.
     * Tự động tạo LearningProgress (status = LEARNING, lastWatchedSecond = 0)
     * nếu đây là lần đầu user mở bài.
     *
     * @param lessonId ID bài học cần xem
     * @param userId   ID user đang yêu cầu
     * @throws com.onlinecourse.exception.ResourceNotFoundException nếu bài không tồn tại
     *         hoặc user không có quyền truy cập
     */
    LessonContentResponse getLessonContent(UUID lessonId, UUID userId);

    /**
     * Cập nhật lastWatchedSecond và status vào LearningProgress.
     * Nếu status = COMPLETED, tính lại progressPercent tổng thể trên Enrollment.
     *
     * @param lessonId ID bài học đang xem
     * @param userId   ID user đang yêu cầu
     * @param request  payload chứa lastWatchedSecond và status mới
     * @throws com.onlinecourse.exception.ResourceNotFoundException nếu không tìm thấy
     *         enrollment hoặc progress record
     */
    void updateProgress(UUID lessonId, UUID userId, LearningProgressRequest request);
}
