package com.onlinecourse.mapper;

import com.onlinecourse.dto.request.course.ChapterCreateRequest;
import com.onlinecourse.dto.request.course.CourseCreateRequest;
import com.onlinecourse.dto.request.course.LessonCreateRequest;
import com.onlinecourse.dto.response.course.ChapterResponse;
import com.onlinecourse.dto.response.course.CourseResponse;
import com.onlinecourse.dto.response.course.LessonResponse;
import com.onlinecourse.entity.Category;
import com.onlinecourse.entity.Chapter;
import com.onlinecourse.entity.Course;
import com.onlinecourse.entity.Lesson;
import com.onlinecourse.entity.User;
import com.onlinecourse.entity.enums.CourseStatus;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-05T08:25:03+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 23 (Oracle Corporation)"
)
@Component
public class CourseMapperImpl implements CourseMapper {

    @Override
    public Course toCourse(CourseCreateRequest request) {
        if ( request == null ) {
            return null;
        }

        Course.CourseBuilder course = Course.builder();

        course.title( request.getTitle() );
        course.description( request.getDescription() );
        course.price( request.getPrice() );
        course.thumbnailUrl( request.getThumbnailUrl() );

        course.status( CourseStatus.DRAFT );

        return course.build();
    }

    @Override
    public CourseResponse toCourseResponse(Course course) {
        if ( course == null ) {
            return null;
        }

        CourseResponse courseResponse = new CourseResponse();

        courseResponse.setInstructorName( courseInstructorFullName( course ) );
        courseResponse.setCategoryName( courseCategoryName( course ) );
        courseResponse.setId( course.getId() );
        courseResponse.setTitle( course.getTitle() );
        courseResponse.setDescription( course.getDescription() );
        courseResponse.setPrice( course.getPrice() );
        courseResponse.setThumbnailUrl( course.getThumbnailUrl() );
        courseResponse.setStatus( course.getStatus() );
        courseResponse.setRejectReason( course.getRejectReason() );
        courseResponse.setChapters( chapterListToChapterResponseList( course.getChapters() ) );

        return courseResponse;
    }

    @Override
    public Chapter toChapter(ChapterCreateRequest request) {
        if ( request == null ) {
            return null;
        }

        Chapter.ChapterBuilder chapter = Chapter.builder();

        chapter.title( request.getTitle() );
        chapter.orderIndex( request.getOrderIndex() );

        return chapter.build();
    }

    @Override
    public ChapterResponse toChapterResponse(Chapter chapter) {
        if ( chapter == null ) {
            return null;
        }

        ChapterResponse chapterResponse = new ChapterResponse();

        chapterResponse.setId( chapter.getId() );
        chapterResponse.setTitle( chapter.getTitle() );
        chapterResponse.setOrderIndex( chapter.getOrderIndex() );
        chapterResponse.setLessons( lessonListToLessonResponseList( chapter.getLessons() ) );

        return chapterResponse;
    }

    @Override
    public Lesson toLesson(LessonCreateRequest request) {
        if ( request == null ) {
            return null;
        }

        Lesson.LessonBuilder lesson = Lesson.builder();

        lesson.title( request.getTitle() );
        lesson.videoUrl( request.getVideoUrl() );
        lesson.durationSeconds( request.getDurationSeconds() );
        lesson.orderIndex( request.getOrderIndex() );
        lesson.isFreePreview( request.getIsFreePreview() );

        return lesson.build();
    }

    @Override
    public LessonResponse toLessonResponse(Lesson lesson) {
        if ( lesson == null ) {
            return null;
        }

        LessonResponse lessonResponse = new LessonResponse();

        lessonResponse.setId( lesson.getId() );
        lessonResponse.setTitle( lesson.getTitle() );
        lessonResponse.setVideoUrl( lesson.getVideoUrl() );
        lessonResponse.setDurationSeconds( lesson.getDurationSeconds() );
        lessonResponse.setOrderIndex( lesson.getOrderIndex() );
        lessonResponse.setIsFreePreview( lesson.getIsFreePreview() );

        return lessonResponse;
    }

    private String courseInstructorFullName(Course course) {
        if ( course == null ) {
            return null;
        }
        User instructor = course.getInstructor();
        if ( instructor == null ) {
            return null;
        }
        String fullName = instructor.getFullName();
        if ( fullName == null ) {
            return null;
        }
        return fullName;
    }

    private String courseCategoryName(Course course) {
        if ( course == null ) {
            return null;
        }
        Category category = course.getCategory();
        if ( category == null ) {
            return null;
        }
        String name = category.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    protected List<ChapterResponse> chapterListToChapterResponseList(List<Chapter> list) {
        if ( list == null ) {
            return null;
        }

        List<ChapterResponse> list1 = new ArrayList<ChapterResponse>( list.size() );
        for ( Chapter chapter : list ) {
            list1.add( toChapterResponse( chapter ) );
        }

        return list1;
    }

    protected List<LessonResponse> lessonListToLessonResponseList(List<Lesson> list) {
        if ( list == null ) {
            return null;
        }

        List<LessonResponse> list1 = new ArrayList<LessonResponse>( list.size() );
        for ( Lesson lesson : list ) {
            list1.add( toLessonResponse( lesson ) );
        }

        return list1;
    }
}
