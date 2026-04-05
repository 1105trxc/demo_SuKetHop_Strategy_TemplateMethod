package com.onlinecourse.dto.response.payment;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentResponse {

    /**
     * "00" = success, other codes = error.
     */
    private String code;

    private String message;

    /**
     * The full VNPAY payment URL the frontend must redirect the user to.
     * null when code != "00".
     */
    private String paymentUrl;
}
