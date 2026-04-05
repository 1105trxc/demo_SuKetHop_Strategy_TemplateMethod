package com.onlinecourse.repository;

import com.onlinecourse.entity.RefundRequest;
import com.onlinecourse.entity.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, UUID> {
    List<RefundRequest> findByUserId(UUID userId);
    List<RefundRequest> findByStatus(RequestStatus status);
}
