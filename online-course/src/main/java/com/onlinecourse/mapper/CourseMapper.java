package com.onlinecourse.mapper;

import com.onlinecourse.dto.request.course.ChapterCreateRequest;
import com.onlinecourse.dto.request.course.CourseCreateRequest;
import com.onlinecourse.dto.request.course.LessonCreateRequest;
import com.onlinecourse.dto.response.course.ChapterResponse;
import com.onlinecourse.dto.response.course.CourseResponse;
import com.onlinecourse.dto.response.course.LessonResponse;
import com.onlinecourse.entity.Chapter;
import com.onlinecourse.entity.Course;
import com.onlinecourse.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    @Mapping(target = "id",         ignore = true)
    @Mapping(target = "status",     constant = "DRAFT")
    @Mapping(target = "chapters",   ignore = true)
    @Mapping(target = "category",   ignore = true)
    @Mapping(target = "instructor", ignore = true)
    Course toCourse(CourseCreateRequest request);

    @Mapping(source = "instructor.fullName", target = "instructorName")
    @Mapping(source = "category.name",       target = "categoryName")
    CourseResponse toCourseResponse(Course course);

    @Mapping(target = "id",      ignore = true)
    @Mapping(target = "lessons", ignore = true)
    @Mapping(target = "course",  ignore = true)
    Chapter toChapter(ChapterCreateRequest request);

    ChapterResponse toChapterResponse(Chapter chapter);

    @Mapping(target = "id",      ignore = true)
    @Mapping(target = "chapter", ignore = true)
    Lesson toLesson(LessonCreateRequest request);

    LessonResponse toLessonResponse(Lesson lesson);
}

