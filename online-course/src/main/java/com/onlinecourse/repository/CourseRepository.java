package com.onlinecourse.repository;

import com.onlinecourse.entity.Course;
import com.onlinecourse.entity.enums.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    Page<Course> findByInstructorId(UUID instructorId, Pageable pageable);
    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    // Non-pageable lists if needed
    List<Course> findByInstructorId(UUID instructorId);
    List<Course> findByCategoryId(Integer categoryId);

    /**
     * Eager-fetches Chapters and their Lessons in a single JOIN query.
     * Dùng để build Study Map mà không bị LazyInitializationException hay N+1.
     */
    @Query("""
            SELECT DISTINCT c FROM Course c
            LEFT JOIN FETCH c.chapters ch
            LEFT JOIN FETCH ch.lessons
            WHERE c.id = :courseId
            """)
    Optional<Course> findWithChaptersAndLessonsById(@Param("courseId") UUID courseId);
}
