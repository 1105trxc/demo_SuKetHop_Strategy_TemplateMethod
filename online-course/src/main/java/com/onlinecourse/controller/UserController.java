package com.onlinecourse.controller;

import com.onlinecourse.config.SecurityUtils;
import com.onlinecourse.dto.request.user.UpdatePhoneRequest;
import com.onlinecourse.dto.response.course.CourseResponse;
import com.onlinecourse.entity.Course;
import com.onlinecourse.entity.User;
import com.onlinecourse.entity.Wishlist;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.mapper.CourseMapper;
import com.onlinecourse.repository.CourseRepository;
import com.onlinecourse.repository.UserRepository;
import com.onlinecourse.repository.WishlistRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * UserController — quản lý thông tin tài khoản và wishlist của user hiện tại.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository     userRepository;
    private final SecurityUtils      securityUtils;
    private final WishlistRepository wishlistRepository;
    private final CourseRepository   courseRepository;
    private final CourseMapper       courseMapper;

    // ─── Profile ──────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> getMyProfile() {
        return ResponseEntity.ok(securityUtils.getCurrentUser());
    }

    @PutMapping("/me/phone")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> updatePhone(
            @Valid @RequestBody UpdatePhoneRequest request
    ) {
        User user = securityUtils.getCurrentUser();
        user.setPhoneNumber(request.getPhoneNumber());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật số điện thoại thành công.",
                "phoneNumber", request.getPhoneNumber()
        ));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @Valid @RequestBody com.onlinecourse.dto.request.user.UserProfileUpdateRequest request
    ) {
        User user = securityUtils.getCurrentUser();
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        // Currently there is no bio in User.java, but if needed we can set it.
        // I will just save the core fields that exist.
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật hồ sơ thành công.",
                "user", user
        ));
    }

    // ─── Wishlist ─────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/users/me/wishlist
     * Lấy danh sách khóa học trong wishlist của user hiện tại.
     */
    @GetMapping("/me/wishlist")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CourseResponse>> getMyWishlist() {
        UUID userId = java.util.Objects.requireNonNull(securityUtils.getCurrentUserId());
        List<CourseResponse> wishlist = wishlistRepository.findByUserId(userId)
                .stream()
                .map(w -> courseMapper.toCourseResponse(w.getCourse()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(wishlist);
    }

    /**
     * POST /api/v1/users/me/wishlist/{courseId}
     * Thêm khóa học vào wishlist. Nếu đã có thì không làm gì (idempotent).
     */
    @PostMapping("/me/wishlist/{courseId}")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, Object>> addToWishlist(@PathVariable UUID courseId) {
        UUID userId = java.util.Objects.requireNonNull(securityUtils.getCurrentUserId());

        if (wishlistRepository.existsByUserIdAndCourseId(userId, courseId)) {
            return ResponseEntity.ok(Map.of("wishlisted", true, "message", "Đã có trong danh sách yêu thích."));
        }

        User user = securityUtils.getCurrentUser();
        Course course = courseRepository.findById(java.util.Objects.requireNonNull(courseId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học!"));

        wishlistRepository.save(
                java.util.Objects.requireNonNull(
                        Wishlist.builder().user(user).course(course).build()
                ));
        return ResponseEntity.ok(Map.of("wishlisted", true, "message", "Đã thêm vào danh sách yêu thích!"));
    }

    /**
     * DELETE /api/v1/users/me/wishlist/{courseId}
     * Xóa khóa học khỏi wishlist.
     */
    @DeleteMapping("/me/wishlist/{courseId}")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<Map<String, Object>> removeFromWishlist(@PathVariable UUID courseId) {
        UUID userId = java.util.Objects.requireNonNull(securityUtils.getCurrentUserId());
        wishlistRepository.deleteByUserIdAndCourseId(userId, courseId);
        return ResponseEntity.ok(Map.of("wishlisted", false, "message", "Đã xóa khỏi danh sách yêu thích."));
    }

    /**
     * GET /api/v1/users/me/wishlist/{courseId}/status
     * Kiểm tra xem khóa học có trong wishlist không.
     */
    @GetMapping("/me/wishlist/{courseId}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> checkWishlistStatus(@PathVariable UUID courseId) {
        UUID userId = java.util.Objects.requireNonNull(securityUtils.getCurrentUserId());
        boolean wishlisted = wishlistRepository.existsByUserIdAndCourseId(userId, courseId);
        return ResponseEntity.ok(Map.of("wishlisted", wishlisted));
    }
}
