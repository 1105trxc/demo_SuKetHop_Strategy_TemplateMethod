package com.onlinecourse.controller;

import com.onlinecourse.config.VnpayConfig;
import com.onlinecourse.dto.response.payment.IpnResponse;
import com.onlinecourse.dto.response.payment.PaymentResponse;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.PaymentMethod;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.repository.OrderRepository;
import com.onlinecourse.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService   paymentService;
    private final OrderRepository  orderRepository;
    private final VnpayConfig      vnpayConfig;

    // ─── 1. Create Payment URL ────────────────────────────────────────────────
    @GetMapping("/create-url/{orderId}")
    public ResponseEntity<PaymentResponse> createPaymentUrl(
            @PathVariable UUID orderId,
            HttpServletRequest request
    ) {
        Order order = orderRepository.findById(Objects.requireNonNull(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));

        String paymentUrl = paymentService.createPaymentUrl(order, request);

        return ResponseEntity.ok(PaymentResponse.builder()
                .code("00")
                .message("Tạo URL thanh toán thành công")
                .paymentUrl(paymentUrl)
                .build());
    }

    // ─── 2. VNPAY IPN Webhook ─────────────────────────────────────────────────
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<IpnResponse> vnpayIpn(HttpServletRequest request) {
        IpnResponse ipnResponse = paymentService.processIpn(request);
        return ResponseEntity.ok(ipnResponse);
    }

    // ─── 3. MOMO IPN ─────────────────────────────────────────────────────────
    @PostMapping("/momo-ipn")
    public ResponseEntity<Void> momoIpn(
            HttpServletRequest request,
            @RequestBody(required = false) String momoBodyJson
    ) {
        log.info("[MOMO-IPN] Nhan duoc yeu cau Webhook tu Momo.");
        if (momoBodyJson != null) {
            request.setAttribute("MOMO_PAYLOAD", momoBodyJson); 
        }
        paymentService.processIpn(PaymentMethod.MOMO, request);
        return ResponseEntity.noContent().build();
    }
    // ─── 3.5 SEPAY IPN ────────────────────────────────────────────────────────
    @PostMapping("/sepay-ipn")
    public ResponseEntity<Void> sepayIpn(
            HttpServletRequest request,
            @RequestBody(required = false) String sepayBodyJson
    ) {
        log.info("[SEPAY-IPN] Nhan yeu cau Webhook nhan tien tu SePay.");
        if (sepayBodyJson != null) {
            request.setAttribute("SEPAY_PAYLOAD", sepayBodyJson);
        }
        paymentService.processIpn(PaymentMethod.SEPAY, request);
        return ResponseEntity.ok().build(); // SePay yêu cầu code 200 OK
    }

    // ─── 4. VNPAY Return URL (User-facing) ────────────────────────────────────
    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayReturn(HttpServletRequest request) {
        // Thực thi ngay đoạn xử lý IPN để lưu Database (Vì chạy local, server của VNPAY khoong thể gọi IPN webhook).
        paymentService.processIpn(PaymentMethod.VNPAY, request);

        // VNPAY v2.1.0: thành công khi CẢ HAI responseCode VÀ transactionStatus là "00"
        String responseCode      = Optional.ofNullable(request.getParameter("vnp_ResponseCode")).orElse("99");
        String transactionStatus = Optional.ofNullable(request.getParameter("vnp_TransactionStatus")).orElse("99");
        String transactionNo     = Optional.ofNullable(request.getParameter("vnp_TransactionNo")).orElse("N/A");
        String orderRef          = Optional.ofNullable(request.getParameter("vnp_TxnRef")).orElse("");

        String redirectUrl = "http://localhost:5173/payment/result"
                + "?provider=VNPAY"
                + "&vnp_TxnRef="           + URLEncoder.encode(orderRef, StandardCharsets.UTF_8)
                + "&vnp_TransactionNo="    + URLEncoder.encode(transactionNo, StandardCharsets.UTF_8)
                + "&vnp_ResponseCode="     + URLEncoder.encode(responseCode, StandardCharsets.UTF_8)
                + "&vnp_TransactionStatus=" + URLEncoder.encode(transactionStatus, StandardCharsets.UTF_8);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(Objects.requireNonNull(URI.create(redirectUrl)))
                .build();
    }
}