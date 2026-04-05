package com.onlinecourse.repository;

import com.onlinecourse.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {

    List<Wishlist> findByUserId(UUID userId);

    Optional<Wishlist> findByUserIdAndCourseId(UUID userId, UUID courseId);

    boolean existsByUserIdAndCourseId(UUID userId, UUID courseId);

    void deleteByUserIdAndCourseId(UUID userId, UUID courseId);
}
