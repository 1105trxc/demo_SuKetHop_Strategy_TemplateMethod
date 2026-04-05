package com.onlinecourse.controller;

import com.onlinecourse.config.SecurityUtils;
import com.onlinecourse.dto.response.course.CourseResponse;
import com.onlinecourse.mapper.CourseMapper;
import com.onlinecourse.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final SecurityUtils securityUtils;
    private final CourseMapper courseMapper;

    /**
     * Lấy danh sách khóa học mà user hiện tại đã ghi danh.
     */
    @GetMapping("/my-courses")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getMyEnrollments() {
        UUID userId = Objects.requireNonNull(securityUtils.getCurrentUserId());

        List<Map<String, Object>> enrollments = enrollmentRepository.findByUserId(userId)
                .stream()
                .map(e -> {
                    CourseResponse courseRes = courseMapper.toCourseResponse(e.getCourse());
                    return Map.of(
                            "id", e.getId(),
                            "enrolledAt", e.getEnrolledAt(),
                            "progressPercent", e.getProgressPercent(),
                            "course", courseRes
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(enrollments);
    }
}
