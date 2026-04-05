package com.onlinecourse.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.onlinecourse.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements FileUploadService {

    private final Cloudinary cloudinary;

    @Override
    public String uploadFile(MultipartFile file, String folderName) {
        try {
            byte[] fileBytes = file.getBytes();
            String contentType = file.getContentType();
            String resourceType = "auto";
            
            if (contentType != null && contentType.startsWith("video/")) {
                resourceType = "video";
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    fileBytes,
                    ObjectUtils.asMap(
                            "folder", folderName,
                            "resource_type", resourceType
                    )
            );

            return (String) uploadResult.get("secure_url");

        } catch (IOException e) {
            throw new RuntimeException("Tải file lên Cloudinary thất bại: " + e.getMessage(), e);
        }
    }
}
