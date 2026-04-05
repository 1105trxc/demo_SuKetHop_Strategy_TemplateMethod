package com.onlinecourse.service.impl;

import com.onlinecourse.dto.request.course.CourseCreateRequest;
import com.onlinecourse.dto.request.course.CourseUpdateRequest;
import com.onlinecourse.dto.response.course.CourseResponse;
import com.onlinecourse.entity.Category;
import com.onlinecourse.entity.Course;
import com.onlinecourse.entity.User;
import com.onlinecourse.entity.enums.CourseStatus;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.mapper.CourseMapper;
import com.onlinecourse.repository.CategoryRepository;
import com.onlinecourse.repository.CourseRepository;
import com.onlinecourse.repository.UserRepository;
import com.onlinecourse.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository   courseRepository;
    private final UserRepository     userRepository;
    private final CategoryRepository categoryRepository;
    private final CourseMapper       courseMapper;

    // ─── Create ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CourseResponse createCourse(CourseCreateRequest request, @NonNull UUID instructorId) {
        User instructor = userRepository.findById(java.util.Objects.requireNonNull(instructorId))
                .orElseThrow(() -> new ResourceNotFoundException("Giảng viên không tồn tại!"));

        Category category = categoryRepository.findById(Objects.requireNonNull(request.getCategoryId()))
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại!"));

        Course course = courseMapper.toCourse(request);
        course.setInstructor(instructor);
        course.setCategory(category);
        course.setStatus(CourseStatus.DRAFT);

        return courseMapper.toCourseResponse(courseRepository.save(course));
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(courseMapper::toCourseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID id) {
        Course course = courseRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học!"));
        return courseMapper.toCourseResponse(course);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getMyCoursesAsInstructor(@NonNull UUID instructorId) {
        return courseRepository.findByInstructorId(instructorId).stream()
                .map(courseMapper::toCourseResponse)
                .collect(Collectors.toList());
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CourseResponse updateCourse(UUID id, CourseUpdateRequest request, @NonNull UUID instructorId) {
        Course course = courseRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học!"));

        if (!course.getInstructor().getId().equals(instructorId)) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa khóa học này!");
        }

        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ có thể chỉnh sửa khóa học ở trạng thái Nháp!");
        }

        Category category = categoryRepository.findById(Objects.requireNonNull(request.getCategoryId()))
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại!"));

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice());
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setCategory(category);

        return courseMapper.toCourseResponse(courseRepository.save(course));
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteCourse(UUID id, @NonNull UUID instructorId) {
        Course course = courseRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học!"));

        if (!course.getInstructor().getId().equals(instructorId)) {
            throw new AccessDeniedException("Bạn không có quyền xóa khóa học này!");
        }

        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ có thể xóa khóa học ở trạng thái Nháp!");
        }

        courseRepository.delete(course);
    }

    // ─── Submit for Approval ──────────────────────────────────────────────────

    @Override
    @Transactional
    public CourseResponse submitForApproval(UUID courseId, @NonNull UUID instructorId) {
        Course course = courseRepository.findById(java.util.Objects.requireNonNull(courseId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học!"));

        if (!course.getInstructor().getId().equals(instructorId)) {
            throw new AccessDeniedException("Bạn không có quyền gửi yêu cầu phê duyệt khóa học này!");
        }

        if (course.getStatus() != CourseStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ khóa học ở trạng thái Nháp mới có thể gửi phê duyệt!");
        }

        course.setStatus(CourseStatus.PENDING_APPROVAL);
        course.setRejectReason(null);
        return courseMapper.toCourseResponse(courseRepository.save(course));
    }

    // ─── Admin Methods ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getPendingCourses() {
        return courseRepository.findByStatus(CourseStatus.PENDING_APPROVAL, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(courseMapper::toCourseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CourseResponse approveCourse(UUID id) {
        Course course = courseRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học!"));

        if (course.getStatus() != CourseStatus.PENDING_APPROVAL) {
            throw new IllegalArgumentException("Khóa học không ở trạng thái chờ duyệt!");
        }

        course.setStatus(CourseStatus.PUBLISHED);
        course.setRejectReason(null);
        return courseMapper.toCourseResponse(courseRepository.save(course));
    }

    @Override
    @Transactional
    public CourseResponse rejectCourse(UUID id, String reason) {
        Course course = courseRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học!"));

        if (course.getStatus() != CourseStatus.PENDING_APPROVAL) {
            throw new IllegalArgumentException("Khóa học không ở trạng thái chờ duyệt!");
        }

        course.setStatus(CourseStatus.DRAFT);
        course.setRejectReason(reason);
        return courseMapper.toCourseResponse(courseRepository.save(course));
    }

    @Override
    @Transactional
    public CourseResponse hideCourse(UUID id) {
        Course course = courseRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học!"));

        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new IllegalArgumentException("Chỉ có thể thu hồi khóa học đang được public!");
        }

        course.setStatus(CourseStatus.HIDDEN);
        return courseMapper.toCourseResponse(courseRepository.save(course));
    }
}