package com.onlinecourse.controller;

import com.onlinecourse.entity.Category;
import com.onlinecourse.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CategoryController — cung cấp danh sách category cho frontend.
 * PUBLIC endpoint, không yêu cầu authentication.
 */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    /**
     * GET /api/v1/categories
     * Trả về tất cả category (cả cha lẫn con).
     * Frontend dùng để populate dropdown khi tạo khoá học.
     */
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    /**
     * GET /api/v1/categories/roots
     * Trả về chỉ category gốc (không có parent).
     */
    @GetMapping("/roots")
    public ResponseEntity<List<Category>> getRootCategories() {
        return ResponseEntity.ok(categoryRepository.findByParentIsNull());
    }
}
