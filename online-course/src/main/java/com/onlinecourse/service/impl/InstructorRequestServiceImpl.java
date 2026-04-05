package com.onlinecourse.service.impl;

import com.onlinecourse.dto.request.auth.InstructorRegisterReq;
import com.onlinecourse.entity.InstructorRequest;
import com.onlinecourse.entity.Role;
import com.onlinecourse.entity.User;
import com.onlinecourse.entity.enums.RequestStatus;
import com.onlinecourse.entity.enums.RoleType;
import com.onlinecourse.exception.ResourceNotFoundException;
import com.onlinecourse.repository.InstructorRequestRepository;
import com.onlinecourse.repository.RoleRepository;
import com.onlinecourse.repository.UserRepository;
import com.onlinecourse.service.InstructorRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InstructorRequestServiceImpl implements InstructorRequestService {

    private final InstructorRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void submitRequest(UUID userId, InstructorRegisterReq req) {
        User user = userRepository.findById(java.util.Objects.requireNonNull(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy User"));

        // Chặn spam: Kiểm tra xem user có đơn nào đang PENDING không
        boolean hasPending = requestRepository.existsByUserIdAndStatus(userId, RequestStatus.PENDING);
        if (hasPending) {
            throw new IllegalArgumentException("Bạn đã có một yêu cầu đang chờ duyệt, vui lòng không gửi lại.");
        }

        InstructorRequest request = InstructorRequest.builder()
                .user(user)
                .expertise(req.getExpertise())
                .portfolioUrl(req.getPortfolioUrl())
                .cvFileUrl(req.getCvFileUrl())
                .status(RequestStatus.PENDING)
                .build();

        requestRepository.save(request);
    }

    @Override
    @Transactional
    public void approveRequest(UUID requestId) {
        InstructorRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu đăng ký"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalArgumentException("Chỉ có thể duyệt các yêu cầu đang ở trạng thái PENDING");
        }

        // Cập nhật trạng thái
        request.setStatus(RequestStatus.APPROVED);
        requestRepository.save(request);

        // Cấp quyền ROLE_INSTRUCTOR cho User
        User user = request.getUser();
        Role instructorRole = roleRepository.findByName(RoleType.ROLE_INSTRUCTOR)
                .orElseThrow(() -> new ResourceNotFoundException("Hệ thống chưa cấu hình quyền INSTRUCTOR"));

        user.addRole(instructorRole);
        userRepository.save(user);
    }
}