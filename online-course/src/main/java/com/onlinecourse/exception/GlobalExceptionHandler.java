package com.onlinecourse.exception;

import com.onlinecourse.dto.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ─── 404 Not Found ────────────────────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    // ─── 400 Bad Request — DTO validation (@NotBlank, @Min, @NotNull …) ───────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    // ─── 400 Bad Request — Business rule violations (email đã tồn tại, …) ────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    // ─── 422 Unprocessable Entity — State violations (PHONE_REQUIRED, COURSE_UNAVAILABLE) ─
    // Prefix trong message dùng để Frontend parse và xử lý UX riêng từng trường hợp.
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, "Unprocessable Entity", ex.getMessage());
    }

    // ─── 401 Unauthorized — sai email/mật khẩu hoặc token hết hạn ────────────
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Unauthorized",
                "Email hoặc mật khẩu không đúng.");
    }

    // ─── 403 Forbidden — đúng token nhưng không đủ quyền ────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Forbidden",
                "Bạn không có quyền truy cập tài nguyên này.");
    }

    // ─── 500 Internal Server Error — catch-all ────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ex.printStackTrace(); // Dump to console
        String detail = ex.getClass().getName() + ": " + ex.getMessage();
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", detail);
    }

    // ─── Builder helper ───────────────────────────────────────────────────────
    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String error, String message) {
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(error)
                .message(message)
                .build();
        return ResponseEntity.status(status).body(body);
    }
}
