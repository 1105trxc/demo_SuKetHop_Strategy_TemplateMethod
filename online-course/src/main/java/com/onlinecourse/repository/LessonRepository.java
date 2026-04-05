package com.onlinecourse.repository;

import com.onlinecourse.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findByChapterIdOrderByOrderIndexAsc(UUID chapterId);

    /**
     * Fetches the Lesson together with its Chapter and the Chapter's Course
     * in a single JOIN query.
     *
     * Cần thiết trong getLessonContent() và updateProgress() để tránh
     * LazyInitializationException khi đọc lesson.getChapter().getCourse().getId().
     */
    @Query("""
            SELECT l FROM Lesson l
            JOIN FETCH l.chapter ch
            JOIN FETCH ch.course
            WHERE l.id = :lessonId
            """)
    Optional<Lesson> findWithChapterAndCourseById(@Param("lessonId") UUID lessonId);
}
