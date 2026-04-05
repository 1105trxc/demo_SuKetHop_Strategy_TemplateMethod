package com.onlinecourse.service.impl;

import com.onlinecourse.dto.request.course.ChapterCreateRequest;
import com.onlinecourse.dto.response.course.ChapterResponse;
import com.onlinecourse.entity.Chapter;
import com.onlinecourse.entity.Course;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.mapper.CourseMapper;
import com.onlinecourse.repository.ChapterRepository;
import com.onlinecourse.repository.CourseRepository;
import com.onlinecourse.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ChapterServiceImpl implements ChapterService {

    private final ChapterRepository chapterRepository;
    private final CourseRepository courseRepository;
    private final CourseMapper courseMapper;

    @Override
    @Transactional
    public ChapterResponse createChapter(ChapterCreateRequest request, @org.springframework.lang.NonNull java.util.UUID instructorId) {
        Course course = courseRepository.findById(Objects.requireNonNull(request.getCourseId(), "Course ID must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Khóa học không tồn tại!"));

        if (!course.getInstructor().getId().equals(instructorId)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền chỉnh sửa khóa học này!");
        }

        Chapter chapter = courseMapper.toChapter(request);
        course.addChapter(chapter); 
        
        Chapter savedChapter = chapterRepository.save(Objects.requireNonNull(chapter, "Chapter must not be null"));
        return courseMapper.toChapterResponse(savedChapter);
    }
}
