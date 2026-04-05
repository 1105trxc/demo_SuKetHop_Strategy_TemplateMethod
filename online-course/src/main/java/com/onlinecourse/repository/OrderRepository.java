package com.onlinecourse.repository;

import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByUserId(UUID userId);
    
    List<Order> findByUserIdAndStatus(UUID userId, OrderStatus status);
    
    @Query("SELECT t.order FROM Transaction t WHERE t.transactionNo = :transactionNo")
    Optional<Order> findByTransactionNo(@Param("transactionNo") String transactionNo);
}
