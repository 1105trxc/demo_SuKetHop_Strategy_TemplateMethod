package com.onlinecourse.service;

import com.onlinecourse.dto.request.course.CourseCreateRequest;
import com.onlinecourse.dto.request.course.CourseUpdateRequest;
import com.onlinecourse.dto.response.course.CourseResponse;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.UUID;

public interface CourseService {
    CourseResponse createCourse(CourseCreateRequest request, @NonNull UUID instructorId);

    List<CourseResponse> getAllCourses();

    CourseResponse getCourseById(UUID id);

    /** Lấy danh sách khoá học mà instructor hiện tại đã tạo. */
    List<CourseResponse> getMyCoursesAsInstructor(@NonNull UUID instructorId);

    CourseResponse submitForApproval(UUID id, @NonNull UUID instructorId);

    /** Cập nhật thông tin khóa học (chỉ khi status = DRAFT). */
    CourseResponse updateCourse(UUID id, CourseUpdateRequest request, @NonNull UUID instructorId);

    /** Xóa khóa học (chỉ khi status = DRAFT). */
    void deleteCourse(UUID id, @NonNull UUID instructorId);

    /** Thu hồi khóa học (Admin - set HIDDEN). */
    CourseResponse hideCourse(UUID id);

    // Admin methods
    List<CourseResponse> getPendingCourses();
    CourseResponse approveCourse(UUID id);
    CourseResponse rejectCourse(UUID id, String reason);
}