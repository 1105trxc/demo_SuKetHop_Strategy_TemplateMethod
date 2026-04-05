package com.onlinecourse.controller;

import com.onlinecourse.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    /**
     * Upload a file to Cloudinary.
     *
     * POST /api/v1/files/upload
     *
     * Form params:
     *   - file   : the file to upload (required)
     *   - folder : target Cloudinary folder (optional, default = "courses")
     *
     * @return 200 OK with the Cloudinary secure_url as plain text
     */
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "courses") String folder
    ) {
        String secureUrl = fileUploadService.uploadFile(file, folder);
        return ResponseEntity.ok(secureUrl);
    }
}
