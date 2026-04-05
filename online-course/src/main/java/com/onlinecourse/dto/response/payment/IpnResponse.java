package com.onlinecourse.dto.response.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * VNPAY-specified IPN response format.
 * The field names MUST match exactly what VNPAY expects:
 *   {"RspCode":"00","Message":"Confirm Success"}
 */
@Getter
@AllArgsConstructor
public class IpnResponse {

    @JsonProperty("RspCode")
    private String rspCode;

    @JsonProperty("Message")
    private String message;

    // ─── Factory helpers ──────────────────────────────────────────────────────

    public static IpnResponse of(String rspCode, String message) {
        return new IpnResponse(rspCode, message);
    }

    public static IpnResponse confirmSuccess() {
        return new IpnResponse("00", "Confirm Success");
    }
}
