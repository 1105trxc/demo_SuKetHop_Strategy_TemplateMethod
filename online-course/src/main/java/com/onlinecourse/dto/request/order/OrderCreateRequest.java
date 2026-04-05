package com.onlinecourse.dto.request.order;

import com.onlinecourse.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class OrderCreateRequest {
    @NotEmpty
    private List<UUID> courseIds;

    private String couponCode;

    @NotNull
    private PaymentMethod paymentMethod;
}
