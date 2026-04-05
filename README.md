# Online Course Marketplace

Tài liệu này hướng dẫn chạy dự án **fullstack** trên máy local để demo/báo cáo môn học.

## 1. Tổng quan

- `online-course/`: Backend Spring Boot (Java + Maven)
- `frontend-elearning/`: Frontend React + Vite

Kiến trúc chạy local:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Frontend gọi API qua base URL: `http://localhost:8080/api/v1`

## 2. Yêu cầu môi trường

### Backend

- JDK 17 trở lên
- Maven 3.8+
- PostgreSQL (khuyến nghị 14+)

### Frontend

- Node.js **20.19+** hoặc **22.12+**
- npm

> Lưu ý: Vite 8 không chạy với Node 19.x.

## 3. Chuẩn bị cơ sở dữ liệu

1. Đảm bảo PostgreSQL đang chạy trên `localhost:5432`.
2. Tạo database `online_course` (nếu chưa có).

```powershell
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE online_course;"
```

3. Cập nhật thông tin kết nối DB tại:

- `online-course/src/main/resources/application.yml`

Các key cần đúng theo máy local:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`

## 4. Chạy Backend

Mở terminal thứ nhất:

```powershell
Set-Location .\online-course
mvn spring-boot:run
```

Backend chạy mặc định tại:

- `http://localhost:8080`

Tài liệu API (nếu bật Swagger):

- `http://localhost:8080/swagger-ui/index.html`

## 5. Chạy Frontend

Mở terminal thứ hai:

```powershell
Set-Location .\frontend-elearning
npm install
npm run dev
```

Frontend chạy mặc định tại:

- `http://localhost:5173`

## 6. Kiểm tra chạy thành công

Sau khi chạy cả 2 service:

1. Mở `http://localhost:5173`
2. Thử thao tác login / xem course / checkout
3. Theo dõi log backend để kiểm tra request API đến `:8080`

## 7. Một số endpoint thanh toán quan trọng

- `GET /api/v1/payments/create-url/{orderId}`
- `GET /api/v1/payments/vnpay-ipn`
- `POST /api/v1/payments/momo-ipn`
- `POST /api/v1/payments/sepay-ipn`
- `GET /api/v1/payments/vnpay-return`

## 8. Sự cố thường gặp

### 8.1 Frontend không chạy do sai phiên bản Node

Dấu hiệu:

- `Vite requires Node.js version 20.19+ or 22.12+`

Kiểm tra:

```powershell
node -v
npm -v
```

Giải pháp: nâng cấp Node lên bản LTS phù hợp.

### 8.2 Backend lỗi kết nối PostgreSQL

Dấu hiệu:

- `Connection refused` hoặc `FATAL: password authentication failed`

Giải pháp:

1. Kiểm tra dịch vụ PostgreSQL đang chạy
2. Kiểm tra DB `online_course` đã tồn tại
3. Đồng bộ lại cấu hình datasource trong `application.yml`

### 8.3 Frontend gọi API thất bại

Kiểm tra file:

- `frontend-elearning/src/api/axiosClient.js`

Đảm bảo:

- `baseURL` trỏ đúng `http://localhost:8080/api/v1`
- Backend đang chạy ở port `8080`


