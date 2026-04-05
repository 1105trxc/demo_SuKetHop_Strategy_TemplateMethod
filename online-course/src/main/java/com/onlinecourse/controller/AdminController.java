package com.onlinecourse.controller;

import com.onlinecourse.dto.response.course.CourseResponse;
import com.onlinecourse.entity.*;
import com.onlinecourse.entity.enums.RequestStatus;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.repository.*;
import com.onlinecourse.service.CourseService;
import com.onlinecourse.service.InstructorRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AdminController — Trung tâm quản trị hệ thống.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final CourseService                courseService;
    private final CourseRepository             courseRepository;
    private final InstructorRequestService     instructorRequestService;
    private final InstructorRequestRepository  instructorRequestRepository;
    private final RefundRequestRepository      refundRequestRepository;
    private final WalletRepository             walletRepository;
    private final CouponRepository             couponRepository;
    private final CategoryRepository           categoryRepository;
    private final UserRepository               userRepository;

    // ═══════════════════════════════════════════════════════════════════
    // SECTION A: Kiểm duyệt Khóa học
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/courses/pending")
    public ResponseEntity<List<CourseResponse>> getPendingCourses() {
        return ResponseEntity.ok(courseService.getPendingCourses());
    }

    @GetMapping("/courses/all")
    public ResponseEntity<List<CourseResponse>> getAllCoursesAdmin() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @PatchMapping("/courses/{id}/approve")
    public ResponseEntity<CourseResponse> approveCourse(@PathVariable UUID id) {
        return ResponseEntity.ok(courseService.approveCourse(Objects.requireNonNull(id)));
    }

    @PatchMapping("/courses/{id}/reject")
    public ResponseEntity<CourseResponse> rejectCourse(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload
    ) {
        String reason = payload.getOrDefault("reason", "Không đạt yêu cầu");
        return ResponseEntity.ok(courseService.rejectCourse(Objects.requireNonNull(id), reason));
    }

    @PatchMapping("/courses/{id}/hide")
    public ResponseEntity<CourseResponse> hideCourse(@PathVariable UUID id) {
        return ResponseEntity.ok(courseService.hideCourse(Objects.requireNonNull(id)));
    }

    // ═══════════════════════════════════════════════════════════════════
    // SECTION B: Duyệt Giảng viên
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/instructor-requests/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getPendingRequests() {
        return ResponseEntity.ok(mapRequests(
                instructorRequestRepository.findByStatus(RequestStatus.PENDING)));
    }

    @GetMapping("/instructor-requests")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAllInstructorRequests() {
        return ResponseEntity.ok(mapRequests(instructorRequestRepository.findAll()));
    }

    @PutMapping("/instructor-requests/{id}/approve")
    public ResponseEntity<String> approveInstructorRequest(@PathVariable UUID id) {
        instructorRequestService.approveRequest(Objects.requireNonNull(id));
        return ResponseEntity.ok("Duyệt thành công. Học viên đã trở thành Giảng viên.");
    }

    @PutMapping("/instructor-requests/{id}/reject")
    @Transactional
    public ResponseEntity<String> rejectInstructorRequest(@PathVariable UUID id) {
        InstructorRequest req = instructorRequestRepository
                .findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu!"));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new IllegalArgumentException("Chỉ có thể từ chối yêu cầu đang PENDING!");
        }
        req.setStatus(RequestStatus.REJECTED);
        instructorRequestRepository.save(req);
        return ResponseEntity.ok("Đã từ chối yêu cầu đăng ký giảng viên.");
    }

    private List<Map<String, Object>> mapRequests(List<InstructorRequest> requests) {
        return requests.stream().map(req -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", req.getId());
            m.put("userId", req.getUser().getId());
            m.put("userFullName", req.getUser().getFullName());
            m.put("userEmail", req.getUser().getEmail());
            m.put("expertise", req.getExpertise());
            m.put("portfolioUrl", req.getPortfolioUrl());
            m.put("cvFileUrl", req.getCvFileUrl());
            m.put("status", req.getStatus().name());
            m.put("createdAt", req.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════
    // SECTION C: Hoàn tiền
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/refunds")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAllRefunds() {
        return ResponseEntity.ok(mapRefunds(refundRequestRepository.findAll()));
    }

    @GetMapping("/refunds/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getPendingRefunds() {
        return ResponseEntity.ok(mapRefunds(refundRequestRepository.findByStatus(RequestStatus.PENDING)));
    }

    @PatchMapping("/refunds/{id}/approve")
    @Transactional
    public ResponseEntity<Map<String, String>> approveRefund(@PathVariable UUID id) {
        RefundRequest refund = refundRequestRepository
                .findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu hoàn tiền!"));

        if (refund.getStatus() != RequestStatus.PENDING) {
            throw new IllegalArgumentException("Yêu cầu này đã được xử lý rồi!");
        }

        // Lấy hoặc tạo wallet
        Wallet wallet = walletRepository.findByUserId(refund.getUser().getId()).orElseGet(() -> {
            Wallet w = Wallet.builder()
                    .user(refund.getUser())
                    .balance(BigDecimal.ZERO)
                    .build();
            return walletRepository.save(Objects.requireNonNull(w));
        });

        BigDecimal amount = refund.getOrderItem().getPriceAtPurchase() != null
                ? refund.getOrderItem().getPriceAtPurchase()
                : BigDecimal.ZERO;

        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        refund.setStatus(RequestStatus.APPROVED);
        refundRequestRepository.save(refund);

        return ResponseEntity.ok(Map.of(
                "message", "Đã hoàn " + amount + " VNĐ vào ví học viên.",
                "newBalance", wallet.getBalance().toString()
        ));
    }

    @PatchMapping("/refunds/{id}/reject")
    @Transactional
    public ResponseEntity<String> rejectRefund(@PathVariable UUID id) {
        RefundRequest refund = refundRequestRepository
                .findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu hoàn tiền!"));

        if (refund.getStatus() != RequestStatus.PENDING) {
            throw new IllegalArgumentException("Yêu cầu này đã được xử lý rồi!");
        }
        refund.setStatus(RequestStatus.REJECTED);
        refundRequestRepository.save(refund);
        return ResponseEntity.ok("Đã từ chối yêu cầu hoàn tiền.");
    }

    private List<Map<String, Object>> mapRefunds(List<RefundRequest> refunds) {
        return refunds.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("userId", r.getUser().getId());
            m.put("userName", r.getUser().getFullName());
            m.put("userEmail", r.getUser().getEmail());
            m.put("orderItemId", r.getOrderItem().getId());
            m.put("courseTitle", r.getOrderItem().getCourse().getTitle());
            m.put("price", r.getOrderItem().getPriceAtPurchase());
            m.put("reason", r.getReason());
            m.put("status", r.getStatus().name());
            return m;
        }).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════
    // SECTION D: Mã giảm giá CRUD
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    @PostMapping("/coupons")
    @Transactional
    public ResponseEntity<Coupon> createCoupon(@RequestBody Map<String, Object> p) {
        Coupon c = buildCoupon(new Coupon(), p);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(couponRepository.save(Objects.requireNonNull(c)));
    }

    @PutMapping("/coupons/{id}")
    @Transactional
    public ResponseEntity<Coupon> updateCoupon(
            @PathVariable UUID id, @RequestBody Map<String, Object> p
    ) {
        Coupon c = couponRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá!"));
        return ResponseEntity.ok(couponRepository.save(Objects.requireNonNull(buildCoupon(c, p))));
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable UUID id) {
        if (!couponRepository.existsById(Objects.requireNonNull(id)))
            throw new ResourceNotFoundException("Không tìm thấy mã giảm giá!");
        couponRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Coupon buildCoupon(Coupon c, Map<String, Object> p) {
        if (p.containsKey("code"))           c.setCode((String) p.get("code"));
        if (p.containsKey("discountPercent")) c.setDiscountPercent((Integer) p.get("discountPercent"));
        if (p.containsKey("maxDiscountAmount") && p.get("maxDiscountAmount") != null)
            c.setMaxDiscountAmount(new BigDecimal(p.get("maxDiscountAmount").toString()));
        if (p.containsKey("expiryDate") && p.get("expiryDate") != null)
            c.setExpiryDate(LocalDateTime.parse((String) p.get("expiryDate")));
        return c;
    }

    // ═══════════════════════════════════════════════════════════════════
    // SECTION E: Danh mục CRUD
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/categories")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAllCategories() {
        List<Map<String, Object>> result = categoryRepository.findAll().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("parentId", c.getParent() != null ? c.getParent().getId() : null);
            m.put("parentName", c.getParent() != null ? c.getParent().getName() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/categories")
    @Transactional
    public ResponseEntity<Category> createCategory(@RequestBody Map<String, Object> p) {
        Category cat = new Category();
        cat.setName((String) p.get("name"));
        if (p.get("parentId") != null) {
            int parentId = Integer.parseInt(p.get("parentId").toString());
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục cha!"));
            cat.setParent(parent);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryRepository.save(cat));
    }

    @PutMapping("/categories/{id}")
    @Transactional
    public ResponseEntity<Category> updateCategory(
            @PathVariable Integer id, @RequestBody Map<String, Object> p
    ) {
        Category cat = categoryRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục!"));
        if (p.containsKey("name")) cat.setName((String) p.get("name"));
        return ResponseEntity.ok(categoryRepository.save(Objects.requireNonNull(cat)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        if (!categoryRepository.existsById(Objects.requireNonNull(id)))
            throw new ResourceNotFoundException("Không tìm thấy danh mục!");
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // SECTION F: Quản lý người dùng
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("phoneNumber", u.getPhoneNumber());
            m.put("status", u.getStatus().name());
            m.put("roles", u.getRoles().stream()
                    .map(r -> r.getName().name()).collect(Collectors.toList()));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SECTION G: Thống kê tổng quan
    // ═══════════════════════════════════════════════════════════════════

    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers",   userRepository.count());
        stats.put("totalCourses", courseRepository.count());
        stats.put("pendingCourses",
                courseRepository.findByStatus(
                        com.onlinecourse.entity.enums.CourseStatus.PENDING_APPROVAL,
                        org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
        stats.put("pendingInstructorRequests",
                instructorRequestRepository.findByStatus(RequestStatus.PENDING).size());
        stats.put("pendingRefunds",
                refundRequestRepository.findByStatus(RequestStatus.PENDING).size());
        return ResponseEntity.ok(stats);
    }
}
