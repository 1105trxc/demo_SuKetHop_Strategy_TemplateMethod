package com.onlinecourse.repository;

import com.onlinecourse.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    void deleteByCartIdAndCourseId(UUID cartId, UUID courseId);
    boolean existsByCartIdAndCourseId(UUID cartId, UUID courseId);
}
