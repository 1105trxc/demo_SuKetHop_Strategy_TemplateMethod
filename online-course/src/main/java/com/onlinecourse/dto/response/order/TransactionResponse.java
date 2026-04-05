package com.onlinecourse.dto.response.order;

import com.onlinecourse.entity.enums.TransactionStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class TransactionResponse {
    private String transactionNo;
    private BigDecimal amount;
    private TransactionStatus status;
    private LocalDateTime createdAt;
}
