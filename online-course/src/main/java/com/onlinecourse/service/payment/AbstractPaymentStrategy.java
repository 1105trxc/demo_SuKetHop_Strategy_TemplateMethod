package com.onlinecourse.service.payment;

import com.onlinecourse.dto.response.payment.IpnResponse;
import com.onlinecourse.entity.*;
import com.onlinecourse.entity.enums.OrderStatus;
import com.onlinecourse.entity.enums.TransactionStatus;
import com.onlinecourse.repository.EnrollmentRepository;
import com.onlinecourse.repository.OrderRepository;
import com.onlinecourse.repository.TransactionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Template Method Pattern — định nghĩa bộ khung xử lý IPN dùng chung.
 * Các subclass (VnpayPaymentStrategy, MomoPaymentStrategy) chỉ override
 * các bước đặc thù của từng gateway.
 */
@Slf4j
public abstract class AbstractPaymentStrategy implements PaymentStrategy {

    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final EnrollmentRepository enrollmentRepository;

    protected AbstractPaymentStrategy(
            OrderRepository orderRepository,
            TransactionRepository transactionRepository,
            EnrollmentRepository enrollmentRepository
    ) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    // ─── Template Method ─────────────────────────────────────────────────────

    /**
     * Quy trình xử lý IPN dùng chung cho mọi payment gateway.
     * Các bước:
     *   1. Thu thập fields để tính chữ ký
     *   2. Lấy chữ ký gateway gửi về
     *   3. Loại bỏ field chữ ký khỏi map
     *   4. Tính lại chữ ký → so sánh
     *   5. Trích xuất dữ liệu IPN
     *   6. Tìm đơn hàng → validate amount + status
     *   7. Xử lý thành công / thất bại
     */
    @Override
    @Transactional
    public final IpnResponse processIpn(HttpServletRequest request) {
        try {
            Map<String, String> signatureFields = collectSignatureFields(request);
            String receivedHash = extractReceivedSignature(request);
            removeSignatureFields(signatureFields);

            String computedHash = computeSignature(signatureFields);
            if (receivedHash == null || !computedHash.equalsIgnoreCase(receivedHash)) {
                log.warn("[{}-IPN] Invalid signature. received={}, computed={}", getPaymentMethod(), receivedHash, computedHash);
                return IpnResponse.of("97", "Invalid signature");
            }

            PaymentIpnData ipnData = extractIpnData(request);

            Optional<Order> orderOpt = findOrder(ipnData.orderRef());
            if (orderOpt.isEmpty()) {
                log.warn("[{}-IPN] Order not found. orderRef={}", getPaymentMethod(), ipnData.orderRef());
                return IpnResponse.of("01", "Order not found");
            }

            Order order = orderOpt.get();
            if (!isAmountValid(order, ipnData)) {
                log.warn("[{}-IPN] Invalid amount. expected={} received={}",
                        getPaymentMethod(), expectedAmount(order), ipnData.amount());
                return IpnResponse.of("04", "Invalid amount");
            }

            if (order.getStatus() != OrderStatus.PENDING) {
                log.info("[{}-IPN] Order already confirmed. orderRef={}", getPaymentMethod(), ipnData.orderRef());
                return IpnResponse.of("02", "Order already confirmed");
            }

            if (isPaymentSucceeded(ipnData)) {
                handlePaymentSuccess(order, ipnData.transactionNo());
            } else {
                handlePaymentFailure(order, ipnData.transactionNo());
                log.info("[{}-IPN] Payment failed. orderRef={} responseCode={} transactionStatus={}",
                        getPaymentMethod(), ipnData.orderRef(), ipnData.responseCode(), ipnData.transactionStatus());
            }

            return IpnResponse.confirmSuccess();
        } catch (Exception e) {
            log.error("[{}-IPN] Unknown error", getPaymentMethod(), e);
            return IpnResponse.of("99", "Unknown error");
        }
    }

    // ─── Hooks & abstract steps ──────────────────────────────────────────────

    /** Tìm đơn hàng theo orderRef (UUID string). */
    protected Optional<Order> findOrder(String orderRef) {
        return orderRepository.findById(Objects.requireNonNull(UUID.fromString(orderRef)));
    }

    /** Kiểm tra số tiền có khớp không. */
    protected boolean isAmountValid(Order order, PaymentIpnData ipnData) {
        return expectedAmount(order) == ipnData.amount();
    }

    /**
     * Hook mặc định: loại các field chữ ký VNPAY trước khi hash.
     * Subclass có thể override (ví dụ MOMO loại `momo_SecureHash`).
     */
    protected void removeSignatureFields(Map<String, String> signatureFields) {
        signatureFields.remove("vnp_SecureHashType");
        signatureFields.remove("vnp_SecureHash");
    }

    // ─── Abstract steps (bắt buộc subclass implement) ────────────────────────

    /** Số tiền kỳ vọng theo đơn vị của gateway (VNPAY × 100, MOMO nguyên). */
    protected abstract long expectedAmount(Order order);

    /** Thu thập toàn bộ params cần để tính chữ ký. */
    protected abstract Map<String, String> collectSignatureFields(HttpServletRequest request);

    /** Lấy chữ ký mà gateway gửi về trong request. */
    protected abstract String extractReceivedSignature(HttpServletRequest request);

    /** Tính lại chữ ký từ map đã loại bỏ field chữ ký. */
    protected abstract String computeSignature(Map<String, String> signatureFields);

    /** Trích xuất dữ liệu IPN thành record thống nhất. */
    protected abstract PaymentIpnData extractIpnData(HttpServletRequest request);

    /** Trả về true nếu giao dịch thành công theo tiêu chí của gateway. */
    protected abstract boolean isPaymentSucceeded(PaymentIpnData ipnData);

    // ─── Common handlers ─────────────────────────────────────────────────────

    /** Cập nhật Order → PAID, lưu Transaction SUCCESS, tạo Enrollment. */
    protected void handlePaymentSuccess(Order order, String transactionNo) {
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        transactionRepository.save(Objects.requireNonNull(Transaction.builder()
                .order(order)
                .transactionNo(transactionNo)
                .amount(order.getFinalPrice())
                .status(TransactionStatus.SUCCESS)
                .build()));

        for (OrderItem item : order.getOrderItems()) {
            boolean alreadyEnrolled = enrollmentRepository
                    .existsByUserIdAndCourseId(order.getUser().getId(), item.getCourse().getId());

            if (!alreadyEnrolled) {
                enrollmentRepository.save(Objects.requireNonNull(Enrollment.builder()
                        .user(order.getUser())
                        .course(item.getCourse())
                        .enrolledAt(LocalDateTime.now())
                        .progressPercent(0)
                        .build()));
            }
        }

        log.info("[{}-IPN] Payment success. orderId={} transactionNo={}",
                getPaymentMethod(), order.getId(), transactionNo);
    }

    /** Cập nhật Order → CANCELLED, lưu Transaction FAILED. */
    protected void handlePaymentFailure(Order order, String transactionNo) {
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        transactionRepository.save(Objects.requireNonNull(Transaction.builder()
                .order(order)
                .transactionNo(transactionNo)
                .amount(order.getFinalPrice())
                .status(TransactionStatus.FAILED)
                .build()));
    }

    // ─── IPN Data record ─────────────────────────────────────────────────────

    /** Dữ liệu IPN thống nhất giữa các gateway. */
    protected record PaymentIpnData(
            String orderRef,
            String responseCode,
            String transactionStatus,
            long amount,
            String transactionNo
    ) {
    }
}
