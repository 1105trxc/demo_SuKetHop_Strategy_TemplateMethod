package com.onlinecourse.service.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.PaymentMethod;
import com.onlinecourse.repository.EnrollmentRepository;
import com.onlinecourse.repository.OrderRepository;
import com.onlinecourse.repository.TransactionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class MomoPaymentStrategy extends AbstractPaymentStrategy {

    @Value("${momo.partner-code:MOMO}")
    private String partnerCode;
    @Value("${momo.access-key:}")
    private String accessKey;
    @Value("${momo.secret-key:}")
    private String secretKey;
    @Value("${momo.pay-url:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String payUrl;
    @Value("${momo.ipn-url:}")
    private String ipnUrl;
    @Value("${momo.return-url:}")
    private String returnUrl;
    public MomoPaymentStrategy(
            OrderRepository orderRepository,
            TransactionRepository transactionRepository,
            EnrollmentRepository enrollmentRepository
    ) {
        super(orderRepository, transactionRepository, enrollmentRepository);
    }
    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.MOMO;
    }
    @Override
    public String createPaymentUrl(Order order, HttpServletRequest request) {
        long amount = expectedAmount(order);
        String orderId = order.getId().toString();
        String requestId = UUID.randomUUID().toString();
        String requestType = "payWithMethod";
        String extraData = "";
        String orderInfo = "Thanh toan don hang " + orderId;

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + returnUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        String signature = hmacSHA256(rawSignature, secretKey);
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("partnerCode", partnerCode);
        requestBody.put("partnerName", "OnlineCourse");
        requestBody.put("storeId", "MomoTestStore");
        requestBody.put("requestId", requestId);
        requestBody.put("amount", String.valueOf(amount));
        requestBody.put("orderId", orderId);
        requestBody.put("orderInfo", orderInfo);
        requestBody.put("redirectUrl", returnUrl);
        requestBody.put("ipnUrl", ipnUrl);
        requestBody.put("lang", "vi");
        requestBody.put("requestType", requestType);
        requestBody.put("autoCapture", true);
        requestBody.put("extraData", extraData);
        requestBody.put("signature", signature);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<JsonNode> response = restTemplate.postForEntity(payUrl, requestBody, JsonNode.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode resultNode = java.util.Objects.requireNonNull(response.getBody());
            if (resultNode.has("payUrl")) {
                return resultNode.get("payUrl").asText();
            }
        }
        throw new RuntimeException("Lỗi kết nối MOMO Sandbox API. Response: " + response.getBody());
    }
    @Override
    protected long expectedAmount(Order order) {
        return order.getFinalPrice().setScale(0, RoundingMode.HALF_UP).longValue();
    }
    @Override
    protected Map<String, String> collectSignatureFields(HttpServletRequest request) {
        try {
            String jsonBody = (String) request.getAttribute("MOMO_PAYLOAD");
            if (jsonBody == null) {
                jsonBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                request.setAttribute("MOMO_PAYLOAD", jsonBody);
                log.info("[MOMO-IPN] Webhook Payload: {}", jsonBody);
            }
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(jsonBody);
            Map<String, String> fields = new HashMap<>();
            fields.put("accessKey", accessKey);
            fields.put("amount", node.path("amount").asText(""));
            fields.put("extraData", node.path("extraData").asText(""));
            fields.put("message", node.path("message").asText(""));
            fields.put("orderId", node.path("orderId").asText(""));
            fields.put("orderInfo", node.path("orderInfo").asText(""));
            fields.put("orderType", node.path("orderType").asText(""));
            fields.put("partnerCode", node.path("partnerCode").asText(""));
            fields.put("payType", node.path("payType").asText(""));
            fields.put("requestId", node.path("requestId").asText(""));
            fields.put("responseTime", node.path("responseTime").asText(""));
            fields.put("resultCode", node.path("resultCode").asText(""));
            fields.put("transId", node.path("transId").asText(""));
            return fields;
        } catch (Exception e) {
            log.error("Loi doc payload MOMO IPN", e);
            return new HashMap<>();
        }
    }
    @Override
    protected String extractReceivedSignature(HttpServletRequest request) {
        try {
            String jsonBody = (String) request.getAttribute("MOMO_PAYLOAD");
            return new ObjectMapper().readTree(jsonBody).path("signature").asText(null);
        } catch (Exception e) {
            return null;
        }
    }
    @Override
    protected String computeSignature(Map<String, String> signatureFields) {
        String rawSignature = "accessKey=" + signatureFields.get("accessKey")
                + "&amount=" + signatureFields.get("amount")
                + "&extraData=" + signatureFields.get("extraData")
                + "&message=" + signatureFields.get("message")
                + "&orderId=" + signatureFields.get("orderId")
                + "&orderInfo=" + signatureFields.get("orderInfo")
                + "&orderType=" + signatureFields.get("orderType")
                + "&partnerCode=" + signatureFields.get("partnerCode")
                + "&payType=" + signatureFields.get("payType")
                + "&requestId=" + signatureFields.get("requestId")
                + "&responseTime=" + signatureFields.get("responseTime")
                + "&resultCode=" + signatureFields.get("resultCode")
                + "&transId=" + signatureFields.get("transId");
        return hmacSHA256(rawSignature, secretKey);
    }
    @Override
    protected PaymentIpnData extractIpnData(HttpServletRequest request) {
        try {
            String jsonBody = (String) request.getAttribute("MOMO_PAYLOAD");
            JsonNode node = new ObjectMapper().readTree(jsonBody);
            return new PaymentIpnData(
                    node.path("orderId").asText(),
                    node.path("resultCode").asText(),
                    node.path("resultCode").asText(),
                    node.path("amount").asLong(),
                    node.path("transId").asText()
            );
        } catch (Exception e) {
            throw new RuntimeException("Parse MOMO IPN Error", e);
        }
    }
    @Override
    protected boolean isPaymentSucceeded(PaymentIpnData ipnData) {
        return "0".equals(ipnData.responseCode()); 
    }
    private String hmacSHA256(String data, String key) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Loi tao signature MoMo", e);
        }
    }
}
