package com.onlinecourse.service.impl;

import com.onlinecourse.dto.request.learning.LearningProgressRequest;
import com.onlinecourse.dto.response.learning.*;
import com.onlinecourse.entity.*;
import com.onlinecourse.entity.enums.LearningStatus;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.repository.*;
import com.onlinecourse.service.LearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningServiceImpl implements LearningService {

    private final CourseRepository           courseRepository;
    private final LessonRepository           lessonRepository;
    private final EnrollmentRepository       enrollmentRepository;
    private final LearningProgressRepository learningProgressRepository;

    // ─── 1. Study Map ─────────────────────────────────────────────────────────

    /**
     * Trả về bản đồ học tập của khóa học.
     *
     * Logic khoá/mở:
     *  - User đã enrolled → mọi bài học đều mở (isLocked = false), có dữ liệu tiến độ.
     *  - User chưa enrolled → bài isFreePreview mở, còn lại isLocked = true, videoUrl = null.
     *
     * Sử dụng JOIN FETCH để load Chapters + Lessons trong 1 SQL (tránh N+1).
     */
    @Override
    @Transactional(readOnly = true)
    public StudyMapResponse getStudyMap(UUID courseId, UUID userId) {

        // Single query: Course + Chapters + Lessons (no N+1)
        Course course = courseRepository.findWithChaptersAndLessonsById(
                        Objects.requireNonNull(courseId))
                .orElseThrow(() -> new ResourceNotFoundException("Khóa học không tồn tại: " + courseId));

        // userId có thể là null (anonymous user chưa đăng nhập)
        Optional<Enrollment> enrollmentOpt = (userId != null)
                ? enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                : Optional.empty();
        boolean enrolled = enrollmentOpt.isPresent();

        // Build fast lookup map: lessonId → LearningProgress (chỉ khi đã enrolled)
        Map<UUID, LearningProgress> progressMap = new HashMap<>();
        if (enrolled) {
            UUID enrollmentId = Objects.requireNonNull(enrollmentOpt.get().getId());
            learningProgressRepository.findByEnrollmentId(enrollmentId)
                    .forEach(lp -> progressMap.put(
                            Objects.requireNonNull(lp.getLesson().getId()), lp));
        }

        List<ChapterStudyResponse> chapterResponses = course.getChapters().stream()
                .sorted(Comparator.comparingInt(Chapter::getOrderIndex))
                .map(chapter -> buildChapterStudy(chapter, enrolled, progressMap))
                .collect(Collectors.toList());

        return StudyMapResponse.builder()
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .enrolled(enrolled)
                .progressPercent(enrolled ? enrollmentOpt.get().getProgressPercent() : null)
                .chapters(chapterResponses)
                .build();
    }

    private ChapterStudyResponse buildChapterStudy(
            Chapter chapter,
            boolean enrolled,
            Map<UUID, LearningProgress> progressMap
    ) {
        List<LessonProgressResponse> lessonResponses = chapter.getLessons().stream()
                .sorted(Comparator.comparingInt(Lesson::getOrderIndex))
                .map(lesson -> buildLessonProgress(lesson, enrolled, progressMap.get(lesson.getId())))
                .collect(Collectors.toList());

        return ChapterStudyResponse.builder()
                .chapterId(chapter.getId())
                .title(chapter.getTitle())
                .orderIndex(chapter.getOrderIndex())
                .lessons(lessonResponses)
                .build();
    }

    private LessonProgressResponse buildLessonProgress(
            Lesson lesson,
            boolean enrolled,
            LearningProgress progress
    ) {
        boolean freePreview = Boolean.TRUE.equals(lesson.getIsFreePreview());
        boolean locked = !enrolled && !freePreview;

        return LessonProgressResponse.builder()
                .lessonId(lesson.getId())
                .title(lesson.getTitle())
                .durationSeconds(lesson.getDurationSeconds())
                .orderIndex(lesson.getOrderIndex())
                .isFreePreview(freePreview)
                .isLocked(locked)
                // Ẩn videoUrl khi bài bị khoá
                .videoUrl(locked ? null : lesson.getVideoUrl())
                // Đính kèm dữ liệu tiến độ nếu có
                .status(progress != null ? progress.getStatus() : null)
                .lastWatchedSecond(progress != null ? progress.getLastWatchedSecond() : null)
                .build();
    }

    // ─── 2. Lesson Detail ─────────────────────────────────────────────────────

    /**
     * Trả về chi tiết bài học kèm videoUrl.
     *
     * Quy tắc truy cập:
     *  - Bài isFreePreview → mọi user đều xem được.
     *  - Bài thường → chỉ user đã enrolled.
     *  - Vi phạm → ném ResourceNotFoundException với thông báo rõ ràng.
     *
     * Side-effect: Tự động tạo LearningProgress (status = LEARNING) nếu đây là
     * lần đầu user mở bài học này.
     *
     * Dùng JOIN FETCH để load lesson + chapter + course trong 1 SQL query.
     */
    @Override
    @Transactional
    public LessonContentResponse getLessonContent(UUID lessonId, UUID userId) {

        // Single query: Lesson + Chapter + Course (tránh LazyInitializationException)
        Lesson lesson = lessonRepository.findWithChapterAndCourseById(
                        Objects.requireNonNull(lessonId))
                .orElseThrow(() -> new ResourceNotFoundException("Bài học không tồn tại: " + lessonId));

        UUID courseId = Objects.requireNonNull(lesson.getChapter().getCourse().getId());
        boolean freePreview = Boolean.TRUE.equals(lesson.getIsFreePreview());

        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByUserIdAndCourseId(userId, courseId);
        boolean enrolled = enrollmentOpt.isPresent();

        // Kiểm tra quyền truy cập
        if (!freePreview && !enrolled) {
            throw new ResourceNotFoundException(
                    "Bạn chưa đăng ký khóa học này. Hãy mua khóa học để xem nội dung.");
        }

        // Tự động tạo LearningProgress lần đầu mở bài (chỉ cho enrolled user)
        LearningProgress progress = null;
        if (enrolled) {
            Enrollment enrollment = enrollmentOpt.get();
            progress = learningProgressRepository
                    .findByEnrollmentIdAndLessonId(
                            Objects.requireNonNull(enrollment.getId()), lessonId)
                    .orElseGet(() -> learningProgressRepository.save(
                            Objects.requireNonNull(LearningProgress.builder()
                                    .enrollment(enrollment)
                                    .lesson(lesson)
                                    .status(LearningStatus.LEARNING)
                                    .lastWatchedSecond(0)
                                    .build())));
        }

        return LessonContentResponse.builder()
                .lessonId(lesson.getId())
                .title(lesson.getTitle())
                .videoUrl(lesson.getVideoUrl())
                .durationSeconds(lesson.getDurationSeconds())
                .isFreePreview(freePreview)
                .status(progress != null ? progress.getStatus() : null)
                .lastWatchedSecond(progress != null ? progress.getLastWatchedSecond() : null)
                .build();
    }

    // ─── 3. Update Progress ───────────────────────────────────────────────────

    /**
     * Cập nhật lastWatchedSecond và status vào LearningProgress.
     *
     * Khi status = COMPLETED → tính lại progressPercent tổng thể trên Enrollment.
     *
     * Ném ResourceNotFoundException nếu:
     *  - Bài học không tồn tại.
     *  - User không có Enrollment cho khóa học chứa bài này.
     *  - Chưa có record LearningProgress (user chưa từng mở bài này).
     */
    @Override
    @Transactional
    public void updateProgress(UUID lessonId, UUID userId, LearningProgressRequest request) {

        // JOIN FETCH để có sẵn chapter + course (tránh LazyInitializationException)
        Lesson lesson = lessonRepository.findWithChapterAndCourseById(
                        Objects.requireNonNull(lessonId))
                .orElseThrow(() -> new ResourceNotFoundException("Bài học không tồn tại: " + lessonId));

        UUID courseId = Objects.requireNonNull(lesson.getChapter().getCourse().getId());

        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Bạn chưa đăng ký khóa học này. Không thể cập nhật tiến độ."));

        LearningProgress progress = learningProgressRepository
                .findByEnrollmentIdAndLessonId(
                        Objects.requireNonNull(enrollment.getId()), lessonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Chưa có dữ liệu tiến độ cho bài học này. Hãy xem bài trước khi cập nhật."));

        // Áp dụng cập nhật
        progress.setLastWatchedSecond(request.getLastWatchedSecond());
        progress.setStatus(request.getStatus());
        learningProgressRepository.save(progress);

        // Tính lại % nếu bài vừa hoàn thành
        if (request.getStatus() == LearningStatus.COMPLETED) {
            recalculateEnrollmentProgress(enrollment);
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    /**
     * Đếm tổng số bài học trong khóa và số bài đã COMPLETED,
     * rồi cập nhật Enrollment.progressPercent.
     *
     * Dùng dữ liệu đã JOIN FETCH sẵn trên Enrollment.getCourse().getChapters()
     * nên không phát sinh thêm SQL query nào.
     */
    private void recalculateEnrollmentProgress(Enrollment enrollment) {
        long totalLessons = enrollment.getCourse().getChapters().stream()
                .mapToLong(ch -> ch.getLessons().size())
                .sum();

        if (totalLessons == 0) return;

        long completed = learningProgressRepository
                .countByEnrollmentIdAndStatus(
                        Objects.requireNonNull(enrollment.getId()), LearningStatus.COMPLETED);

        int percent = (int) Math.round((completed * 100.0) / totalLessons);
        enrollment.setProgressPercent(percent);
        enrollmentRepository.save(enrollment);
    }
}
