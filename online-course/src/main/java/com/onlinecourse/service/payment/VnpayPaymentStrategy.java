package com.onlinecourse.service.payment;

import com.onlinecourse.config.VnpayConfig;
import com.onlinecourse.entity.Order;
import com.onlinecourse.entity.enums.PaymentMethod;
import com.onlinecourse.repository.EnrollmentRepository;
import com.onlinecourse.repository.OrderRepository;
import com.onlinecourse.repository.TransactionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
/**
 * Concrete Strategy — VNPAY payment gateway.
 * Implement các bước đặc thù của VNPAY trong Template Method.
 */
@Component
@Slf4j
public class VnpayPaymentStrategy extends AbstractPaymentStrategy {
    private final VnpayConfig vnpayConfig;
    public VnpayPaymentStrategy(
            VnpayConfig vnpayConfig,
            OrderRepository orderRepository,
            TransactionRepository transactionRepository,
            EnrollmentRepository enrollmentRepository
    ) {
        super(orderRepository, transactionRepository, enrollmentRepository);
        this.vnpayConfig = vnpayConfig;
    }
    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.VNPAY;
    }
    @Override
    public String createPaymentUrl(Order order, HttpServletRequest request) {
        long amount = expectedAmount(order);
        String txnRef = order.getId().toString();
        Map<String, String> vnpParams = new LinkedHashMap<>();
        vnpParams.put("vnp_Version", VnpayConfig.VERSION);
        vnpParams.put("vnp_Command", VnpayConfig.COMMAND);
        vnpParams.put("vnp_TmnCode", vnpayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amount));
        vnpParams.put("vnp_CurrCode", VnpayConfig.CURRENCY);
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang: " + order.getId());
        vnpParams.put("vnp_OrderType", VnpayConfig.ORDER_TYPE);
        vnpParams.put("vnp_Locale", VnpayConfig.LOCALE);
        vnpParams.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", VnpayConfig.getIpAddress(request));
        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat fmt = new SimpleDateFormat("yyyyMMddHHmmss");
        vnpParams.put("vnp_CreateDate", fmt.format(cld.getTime()));
        cld.add(Calendar.MINUTE, 15);
        vnpParams.put("vnp_ExpireDate", fmt.format(cld.getTime()));
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String name = itr.next();
            String value = vnpParams.get(name);
            if (value != null && !value.isEmpty()) {
                String encodedValue = URLEncoder.encode(value, StandardCharsets.US_ASCII);
                String encodedName  = URLEncoder.encode(name, StandardCharsets.US_ASCII);
                hashData.append(name).append('=').append(encodedValue);
                query.append(encodedName).append('=').append(encodedValue);
                if (itr.hasNext()) {
                    hashData.append('&');
                    query.append('&');
                }
            }
        }
        String secureHash = VnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
        String paymentUrl = vnpayConfig.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;

        log.info("[VNPAY] createPaymentUrl txnRef='{}' amount='{}' tmnCode='{}'",
                txnRef, amount, vnpayConfig.getTmnCode());
        return paymentUrl;
    }
    // ─── Template Method steps ───────────────────────────────────────────────
    @Override
    protected long expectedAmount(Order order) {
        return order.getFinalPrice()
                .multiply(BigDecimal.valueOf(100))
                .longValue();
    }
    @Override
    protected Map<String, String> collectSignatureFields(HttpServletRequest request) {
        Map<String, String> fields = new HashMap<>();
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String name  = paramNames.nextElement();
            String value = request.getParameter(name);
            if (value != null && !value.isEmpty()) {           
                fields.put(name, value);
            }
        }
        return fields;
    }
    @Override
    protected String extractReceivedSignature(HttpServletRequest request) {
        return request.getParameter("vnp_SecureHash");
    }
    @Override
    protected String computeSignature(Map<String, String> signatureFields) {
        return vnpayConfig.hashAllFields(signatureFields);
    }
    @Override
    protected PaymentIpnData extractIpnData(HttpServletRequest request) {
        return new PaymentIpnData(
                request.getParameter("vnp_TxnRef"),
                request.getParameter("vnp_ResponseCode"),
                request.getParameter("vnp_TransactionStatus"),
                Long.parseLong(Objects.requireNonNull(
                        request.getParameter("vnp_Amount"), "vnp_Amount is null")),
                request.getParameter("vnp_TransactionNo")
        );
    }
    @Override
    protected boolean isPaymentSucceeded(PaymentIpnData ipnData) {
        return "00".equals(ipnData.responseCode()) && "00".equals(ipnData.transactionStatus());
    }
}
