package com.onlinecourse.service;

import com.onlinecourse.dto.request.auth.InstructorRegisterReq;
import java.util.UUID;

public interface InstructorRequestService {
    void submitRequest(UUID userId, InstructorRegisterReq req);
    void approveRequest(UUID requestId);
}