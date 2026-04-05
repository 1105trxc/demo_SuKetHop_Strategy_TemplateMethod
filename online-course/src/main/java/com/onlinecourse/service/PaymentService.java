package com.onlinecourse.service;

import com.onlinecourse.dto.response.payment.IpnResponse;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.PaymentMethod;
import jakarta.servlet.http.HttpServletRequest;

public interface PaymentService {

    /**
     * Tạo URL redirect đến trang thanh toán của gateway tương ứng với đơn hàng.
     *
     * @param order   đơn hàng cần thanh toán (status PENDING, finalPrice hợp lệ)
     * @param request HTTP request hiện tại (lấy IP client)
     * @return URL redirect đầy đủ (bao gồm chữ ký)
     */
    String createPaymentUrl(Order order, HttpServletRequest request);

    /**
     * Xử lý IPN callback từ VNPAY (mặc định).
     * Verify chữ ký → validate amount & status → cập nhật Order + Transaction + Enrollment.
     *
     * @param request HTTP request từ VNPAY IPN
     * @return IpnResponse theo chuẩn VNPAY {RspCode, Message}
     */
    IpnResponse processIpn(HttpServletRequest request);

    /**
     * Xử lý IPN callback từ gateway cụ thể (VNPAY, MOMO, …).
     *
     * @param paymentMethod gateway cần xử lý
     * @param request       HTTP request từ gateway IPN
     * @return IpnResponse
     */
    IpnResponse processIpn(PaymentMethod paymentMethod, HttpServletRequest request);
}
