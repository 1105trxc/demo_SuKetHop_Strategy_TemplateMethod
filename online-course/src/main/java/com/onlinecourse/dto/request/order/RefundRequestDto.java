package com.onlinecourse.dto.request.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class RefundRequestDto {

    @NotNull(message = "ID mục đơn hàng không được bỏ trống")
    private UUID orderItemId;

    @NotBlank(message = "Lý do hoàn tiền không được bỏ trống")
    private String reason;
}
