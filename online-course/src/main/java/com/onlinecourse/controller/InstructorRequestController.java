package com.onlinecourse.controller;

import com.onlinecourse.config.SecurityUtils;
import com.onlinecourse.dto.request.auth.InstructorRegisterReq;
import com.onlinecourse.entity.InstructorRequest;
import com.onlinecourse.entity.enums.RequestStatus;
import com.onlinecourse.repository.InstructorRequestRepository;
import com.onlinecourse.service.InstructorRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/instructor-requests")
@RequiredArgsConstructor
public class InstructorRequestController {

    private final InstructorRequestService      requestService;
    private final InstructorRequestRepository   requestRepository;
    private final SecurityUtils                 securityUtils;

    @PostMapping
    public ResponseEntity<String> submitRequest(@Valid @RequestBody InstructorRegisterReq req) {
        UUID userId = securityUtils.getCurrentUserId();
        requestService.submitRequest(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body("Gửi yêu cầu thành công. Đang chờ Quản trị viên xét duyệt.");
    }

    /**
     * GET /api/v1/instructor-requests/my-status
     * Trả về trạng thái đơn đăng ký giảng viên mới nhất của user.
     * Frontend dùng để quyết định hiển thị form hay thông báo "Đang chờ duyệt".
     */
    @GetMapping("/my-status")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String, Object>> getMyRequestStatus() {
        UUID userId = securityUtils.getCurrentUserId();
        Optional<InstructorRequest> pending = requestRepository
                .findTopByUserIdOrderByCreatedAtDesc(userId);

        if (pending.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "NONE", "hasPending", false));
        }

        InstructorRequest req = pending.get();
        return ResponseEntity.ok(Map.of(
                "status",     req.getStatus().name(),
                "hasPending", req.getStatus() == RequestStatus.PENDING
        ));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> approveRequest(@PathVariable UUID id) {
        requestService.approveRequest(id);
        return ResponseEntity.ok("Duyệt yêu cầu thành công. Học viên đã chính thức trở thành Giảng viên.");
    }
}