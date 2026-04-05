package com.onlinecourse.entity;

import com.onlinecourse.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Wishlist — Danh sách yêu thích của học viên.
 * Mỗi bản ghi đại diện cho 1 khóa học mà 1 user đã thêm vào wishlist.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "wishlists",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"}))
public class Wishlist extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
}
