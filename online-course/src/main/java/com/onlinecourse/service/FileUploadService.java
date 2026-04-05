package com.onlinecourse.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileUploadService {

    /**
     * Upload a file to Cloudinary and return the secure URL.
     *
     * @param file       the multipart file to upload
     * @param folderName the Cloudinary folder to store the file in (e.g. "courses", "avatars")
     * @return the secure_url string pointing to the uploaded resource
     */
    String uploadFile(MultipartFile file, String folderName);
}
