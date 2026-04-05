package com.onlinecourse.service.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlinecourse.config.SepayConfig;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.PaymentMethod;
import com.onlinecourse.repository.EnrollmentRepository;
import com.onlinecourse.repository.OrderRepository;
import com.onlinecourse.repository.TransactionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Strategy xử lý thanh toán thông qua SePay Webhook (Nhận diện chuyển khoản tự động).
 * VietQR / Bank Transfer Automation.
 */
@Component
@Slf4j
public class SepayPaymentStrategy extends AbstractPaymentStrategy {

    private final SepayConfig sepayConfig;

    public SepayPaymentStrategy(
            SepayConfig sepayConfig,
            OrderRepository orderRepository,
            TransactionRepository transactionRepository,
            EnrollmentRepository enrollmentRepository
    ) {
        super(orderRepository, transactionRepository, enrollmentRepository);
        this.sepayConfig = sepayConfig;
    }
    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.SEPAY;
    }
    @Override
    public String createPaymentUrl(Order order, HttpServletRequest request) {
        String orderId = order.getId().toString();
        long amount = expectedAmount(order);

        String paymentUrl = String.format("https://my.sepay.vn/checkout.html?bank=%s&acc=%s&amount=%d&des=DH%s",
                sepayConfig.getBankId(),
                sepayConfig.getAccNumber(),
                amount,
                orderId
        );
        log.info("[SEPAY] createPaymentUrl (QA Generate): amount={} content=DH{}", amount, orderId);
        return paymentUrl;
    }
    @Override
    protected long expectedAmount(Order order) {
        return order.getFinalPrice().longValue(); // Tiền nguyên, ko nhân 100
    }
    @Override
    protected Map<String, String> collectSignatureFields(HttpServletRequest request) {
        try {
            // Lấy gói dữ liệu IPN
            String jsonBody = (String) request.getAttribute("SEPAY_PAYLOAD");
            if (jsonBody == null) {
                jsonBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                request.setAttribute("SEPAY_PAYLOAD", jsonBody);
            }
            return new HashMap<>();
        } catch (Exception e) {
            log.error("[SEPAY-IPN] Loi doc body JSON", e);
            return new HashMap<>();
        }
    }
    @Override
    protected String extractReceivedSignature(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Apikey ")) {
            return ""; 
        }
        return authHeader.substring(7); 
    }
    @Override
    protected String computeSignature(Map<String, String> signatureFields) {
        return sepayConfig.getApiToken();
    }
    @Override
    protected PaymentIpnData extractIpnData(HttpServletRequest request) {
        try {
            String jsonBody = (String) request.getAttribute("SEPAY_PAYLOAD");
            JsonNode node = new ObjectMapper().readTree(jsonBody);

            String content = node.path("content").asText("");
            String orderRef = extractOrderId(content);

            return new PaymentIpnData(
                    orderRef,
                    node.path("transferType").asText(""), 
                    "00", 
                    node.path("transferAmount").asLong(),
                    node.path("code").asText("") 
            );
        } catch (Exception e) {
            log.error("[SEPAY-IPN] Khong the trich xuat Node Json Giao Dich", e);
            throw new RuntimeException("Parse JSON ERROR", e);
        }
    }
    @Override
    protected boolean isPaymentSucceeded(PaymentIpnData ipnData) {
        return "in".equalsIgnoreCase(ipnData.responseCode()); 
    }
    private String extractOrderId(String content) {
        Pattern pattern = Pattern.compile("DH\\s*([a-fA-F0-9\\-]{36})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "00000000-0000-0000-0000-000000000000";
    }
}
