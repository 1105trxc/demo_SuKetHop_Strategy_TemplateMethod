package com.onlinecourse.controller;

import com.onlinecourse.config.SecurityUtils;
import com.onlinecourse.dto.request.course.CourseCreateRequest;
import com.onlinecourse.dto.request.course.CourseUpdateRequest;
import com.onlinecourse.dto.response.course.CourseResponse;
import com.onlinecourse.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final SecurityUtils securityUtils;

    // ─── Instructor endpoints ──────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseCreateRequest request) {
        CourseResponse response = courseService.createCourse(
                request, Objects.requireNonNull(securityUtils.getCurrentUserId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<List<CourseResponse>> getMyCourses() {
        return ResponseEntity.ok(courseService.getMyCoursesAsInstructor(
                Objects.requireNonNull(securityUtils.getCurrentUserId())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable UUID id,
            @Valid @RequestBody CourseUpdateRequest request
    ) {
        return ResponseEntity.ok(courseService.updateCourse(
                id, request, Objects.requireNonNull(securityUtils.getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<Void> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id, Objects.requireNonNull(securityUtils.getCurrentUserId()));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/submit-approval")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<CourseResponse> submitCourseForApproval(@PathVariable UUID id) {
        return ResponseEntity.ok(courseService.submitForApproval(
                id, Objects.requireNonNull(securityUtils.getCurrentUserId())));
    }

    // ─── Public endpoints ──────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable UUID id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }
}