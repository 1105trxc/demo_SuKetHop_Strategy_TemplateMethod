package com.onlinecourse.service.impl;

import com.onlinecourse.dto.response.payment.IpnResponse;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.PaymentMethod;
import com.onlinecourse.service.PaymentService;
import com.onlinecourse.service.payment.PaymentStrategy;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Context trong Strategy Pattern.
 * Không chứa bất kỳ logic thanh toán nào — chỉ dispatch sang đúng PaymentStrategy.
 */
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final List<PaymentStrategy> paymentStrategies;

    // ─── Strategy resolution ─────────────────────────────────────────────────

    private PaymentStrategy resolveStrategy(PaymentMethod paymentMethod) {
        return paymentStrategies.stream()
                .filter(strategy -> strategy.getPaymentMethod() == paymentMethod)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Payment method is not supported yet: " + paymentMethod));
    }

    private PaymentMethod resolvePaymentMethod(Order order) {
        return Optional.ofNullable(order.getPaymentMethod())
                .orElse(PaymentMethod.VNPAY);
    }

    // ─── PaymentService delegates ────────────────────────────────────────────

    @Override
    public String createPaymentUrl(Order order, HttpServletRequest request) {
        PaymentMethod paymentMethod = resolvePaymentMethod(order);
        return resolveStrategy(paymentMethod).createPaymentUrl(order, request);
    }

    @Override
    public IpnResponse processIpn(HttpServletRequest request) {
        return resolveStrategy(PaymentMethod.VNPAY).processIpn(request);
    }

    @Override
    public IpnResponse processIpn(PaymentMethod paymentMethod, HttpServletRequest request) {
        return resolveStrategy(paymentMethod).processIpn(request);
    }
}