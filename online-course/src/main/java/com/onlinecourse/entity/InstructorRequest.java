package com.onlinecourse.entity;

import com.onlinecourse.entity.base.BaseEntity;
import com.onlinecourse.entity.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "instructor_requests")
public class InstructorRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String expertise;

    @Column(name = "portfolio_url", length = 500)
    private String portfolioUrl;

    @Column(name = "cv_file_url", nullable = false, length = 500)
    private String cvFileUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;
}
