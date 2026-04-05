package com.onlinecourse.service.impl;

import com.onlinecourse.dto.request.course.LessonCreateRequest;
import com.onlinecourse.dto.response.course.LessonResponse;
import com.onlinecourse.entity.Chapter;
import com.onlinecourse.entity.Lesson;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.mapper.CourseMapper;
import com.onlinecourse.repository.ChapterRepository;
import com.onlinecourse.repository.LessonRepository;
import com.onlinecourse.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final ChapterRepository chapterRepository;
    private final CourseMapper courseMapper;

    @Override
    @Transactional
    public LessonResponse createLesson(LessonCreateRequest request, @org.springframework.lang.NonNull java.util.UUID instructorId) {
        Chapter chapter = chapterRepository.findById(Objects.requireNonNull(request.getChapterId(), "Chapter ID must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Chương học không tồn tại!"));

        if (!chapter.getCourse().getInstructor().getId().equals(instructorId)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền thêm bài học vào khóa học này!");
        }

        Lesson lesson = courseMapper.toLesson(request);
        chapter.addLesson(lesson); 
        
        Lesson savedLesson = lessonRepository.save(Objects.requireNonNull(lesson, "Lesson must not be null"));
        return courseMapper.toLessonResponse(savedLesson);
    }
}
