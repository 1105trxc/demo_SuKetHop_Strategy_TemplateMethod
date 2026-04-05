package com.onlinecourse.repository;

import com.onlinecourse.entity.LearningProgress;
import com.onlinecourse.entity.enums.LearningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, UUID> {

    Optional<LearningProgress> findByEnrollmentIdAndLessonId(UUID enrollmentId, UUID lessonId);

    /** Load all progress records for a given enrollment (used for bulk Study Map building). */
    List<LearningProgress> findByEnrollmentId(UUID enrollmentId);

    /** Count how many lessons have a particular status within an enrollment (used for % calc). */
    long countByEnrollmentIdAndStatus(UUID enrollmentId, LearningStatus status);
}
