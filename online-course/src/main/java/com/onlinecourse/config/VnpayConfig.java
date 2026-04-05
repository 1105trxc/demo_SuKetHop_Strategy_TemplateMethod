package com.onlinecourse.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Configuration
@Getter
public class VnpayConfig implements InitializingBean {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    /** Auto-trim config values sau khi Spring inject để tránh lỗi khoảng trắng. */
    @Override
    public void afterPropertiesSet() {
        tmnCode    = normalize(tmnCode);
        hashSecret = normalize(hashSecret);
        payUrl     = normalize(payUrl);
        returnUrl  = normalize(returnUrl);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    public static final String VERSION    = "2.1.0";
    public static final String COMMAND    = "pay";
    public static final String ORDER_TYPE = "other";
    public static final String CURRENCY   = "VND";
    public static final String LOCALE     = "vn";

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) throw new NullPointerException();
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) sb.append(String.format("%02x", b & 0xff));
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ipAdress;
        try {
            ipAdress = request.getHeader("X-FORWARDED-FOR");
            if (ipAdress == null || ipAdress.isEmpty()) ipAdress = request.getRemoteAddr();
            if (ipAdress != null && ipAdress.contains(",")) ipAdress = ipAdress.split(",")[0].trim();
        } catch (Exception e) {
            ipAdress = "127.0.0.1";
        }
        if (ipAdress == null || ipAdress.equals("0:0:0:0:0:0:0:1") || ipAdress.equals("::1")) {
            return "127.0.0.1";
        }
        return ipAdress;
    }

    public String hashAllFields(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        try {
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = fields.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString());
                    sb.append(fieldName).append("=").append(encodedValue);
                }
                if (itr.hasNext()) sb.append("&");
            }
        } catch (Exception e) {
            return "";
        }
        return hmacSHA512(hashSecret.trim(), sb.toString());
    }

    public boolean verifyIpnAndReturn(Map<String, String> requestParams) {
        String receivedHash = requestParams.get("vnp_SecureHash");
        if (receivedHash == null) return false;

        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : requestParams.entrySet()) {
            String fieldName = entry.getKey();
            String fieldValue = entry.getValue();
            if (fieldValue != null && fieldValue.length() > 0
                    && !fieldName.equals("vnp_SecureHashType")
                    && !fieldName.equals("vnp_SecureHash")) {
                fields.put(fieldName, fieldValue);
            }
        }

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        try {
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = fields.get(fieldName);
                hashData.append(fieldName).append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                if (itr.hasNext()) hashData.append('&');
            }
        } catch (Exception e) {
            return false;
        }

        String computedHash = hmacSHA512(hashSecret.trim(), hashData.toString());
        return computedHash.equalsIgnoreCase(receivedHash);
    }
}