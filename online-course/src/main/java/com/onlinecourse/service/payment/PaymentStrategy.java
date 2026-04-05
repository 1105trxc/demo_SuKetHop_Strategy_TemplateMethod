package com.onlinecourse.service.payment;

import com.onlinecourse.dto.response.payment.IpnResponse;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.PaymentMethod;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Strategy Pattern — mỗi payment gateway implement interface này.
 * Cho phép thêm gateway mới mà không sửa code hiện tại.
 */
public interface PaymentStrategy {
    PaymentMethod getPaymentMethod();

    /** Tạo URL redirect đến trang thanh toán của gateway. */
    String createPaymentUrl(Order order, HttpServletRequest request);

    /**
     * Xử lý IPN (Instant Payment Notification) từ gateway.
     * Logic chung nằm trong AbstractPaymentStrategy (Template Method).
     */
    IpnResponse processIpn(HttpServletRequest request);
}
