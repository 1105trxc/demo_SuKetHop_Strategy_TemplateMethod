# KẾT CẤU HỆ THỐNG & NGHIỆP VỤ - DỰ ÁN E-LEARNING MARKETPLACE
(Cập nhật dựa trên Sơ đồ Use Case thực tế)

## 1. TECH STACK (Không đổi)
- Backend: Spring Boot 3.2.4, Spring Security, JWT (HS256), Spring Data JPA, PostgreSQL.
- Frontend: React 18, Vite, TailwindCSS, Context API, Axios.
- 3rd Party: VNPAY (Thanh toán), Cloudinary (Upload file), Gmail SMTP (OTP).

## 2. ACTORS & PHÂN QUYỀN USE CASE CHI TIẾT
Hệ thống gồm 4 cấp độ Actor kế thừa nhau:

### A. Khách (Guest)
- Xem danh sách các khóa học (Public API).

### B. Người dùng đã đăng nhập (Logged-in User)
- Bao gồm: Đăng nhập (JWT), Đăng ký (bao gồm Xác thực email OTP), Đăng xuất.
- Sửa thông tin cá nhân.

### C. Học viên (Student - ROLE_STUDENT)
- **Giỏ hàng & Thanh toán:** Thêm khóa học vào giỏ, Xem giỏ hàng, Đặt hàng (Extend: Áp dụng mã giảm giá), Xem đơn hàng, Xem lịch sử giao dịch.
- **Học tập:** Xem danh sách khóa học đã đăng ký, Học bài giảng, Theo dõi tiến độ học tập.
- **Tài chính & Hỗ trợ:** Xem ví cá nhân (Ví lưu tiền hoàn/hoa hồng), Gửi yêu cầu hoàn tiền.
- **Nâng cấp:** Đăng ký làm Giảng viên.

### D. Giảng viên (Instructor - ROLE_INSTRUCTOR)
- **Quản lý khóa học:** Thêm khóa học, Sửa thông tin khóa học, Xóa khóa học, Xem danh sách khóa học đã tạo.
- **Kiểm duyệt:** Gửi yêu cầu duyệt khóa học (Chuyển trạng thái từ DRAFT -> PENDING_APPROVAL).

### E. Quản trị viên (Admin - ROLE_ADMIN)
- **Kiểm duyệt User:** Duyệt đơn đăng ký giảng viên.
- **Kiểm duyệt Nội dung:** Duyệt khóa học (Từ PENDING_APPROVAL -> PUBLISHED), Thêm/Cập nhật/Xóa danh mục khóa học.
- **Tài chính:** Thêm/Sửa/Xóa mã giảm giá, Duyệt yêu cầu hoàn tiền (Include: Hoàn tiền -> Thu hồi khóa học của User).

## 3. BỔ SUNG DATABASE ENTITIES (So với thiết kế cũ)

Để đáp ứng Use Case mới, Database cần bổ sung/chỉnh sửa các phần sau:

1. **CourseStatus (Enum):** Thêm trạng thái `PENDING_APPROVAL`. (DRAFT -> PENDING_APPROVAL -> PUBLISHED / REJECTED).
2. **Wallet (Entity mới):** OneToOne với User. Có các field: `id`, `user_id`, `balance` (BigDecimal). Chứa tiền hoàn hoặc doanh thu giảng viên.
3. **RefundRequest (Entity mới):** - Fields: `id`, `user_id`, `order_item_id` (Khóa học muốn hoàn), `reason` (Text), `status` (PENDING, APPROVED, REJECTED), `createdAt`.
   - Logic: Khi Admin approve -> Cộng tiền vào `Wallet` -> Xóa bản ghi `Enrollment` (Thu hồi khóa học).
4. **Coupon (Cập nhật):** Có API CRUD đầy đủ cho Admin.

## 4. LUỒNG NGHIỆP VỤ MỚI CẦN CODE

**Luồng 1: Duyệt Khóa Học (Instructor -> Admin)**
- Instructor tạo khóa học (Status = DRAFT).
- Instructor hoàn thiện Video/Bài giảng, bấm "Submit" -> Gọi API đổi Status khóa học thành `PENDING_APPROVAL`.
- Admin xem danh sách khóa học `PENDING_APPROVAL`. Bấm "Duyệt" -> Status thành `PUBLISHED` -> Khách hàng mới thấy được trên trang chủ.

**Luồng 2: Hoàn Tiền & Ví Điện Tử (Student -> Admin)**
- Student mua nhầm, vào Lịch sử đơn hàng, bấm "Yêu cầu hoàn tiền" -> Tạo `RefundRequest`.
- Admin xem danh sách `RefundRequest`.
- Khi Admin duyệt: Logic backend tự động cộng tiền vào `Wallet` của Student, đồng thời XÓA/DISABLE `Enrollment` của Student với khóa học đó (Thu hồi).