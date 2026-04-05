package com.onlinecourse.repository;

import com.onlinecourse.entity.InstructorRequest;
import com.onlinecourse.entity.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InstructorRequestRepository extends JpaRepository<InstructorRequest, UUID> {
    boolean existsByUserIdAndStatus(UUID userId, RequestStatus status);
    List<InstructorRequest> findByUserId(UUID userId);
    List<InstructorRequest> findByStatus(RequestStatus status);

    /** Lấy đơn mới nhất của user (để hiển thị trạng thái trên trang BecomeInstructor). */
    Optional<InstructorRequest> findTopByUserIdOrderByCreatedAtDesc(UUID userId);
}
