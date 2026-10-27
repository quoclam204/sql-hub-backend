# SQL Hub Backend 🚀

Nền tảng học và luyện tập SQL song ngữ Việt - Anh dành cho học viên và quản trị viên, xây dựng trên nền tảng **NestJS** và **PostgreSQL (TypeORM)**.

---

## 🛠 Công nghệ sử dụng
- **Backend**: NestJS (TypeScript), TypeORM, PostgreSQL.
- **Xác thực**: JWT, Refresh Token, Google OAuth, GitHub OAuth, Email/Password.
- **Tài liệu API**: Swagger UI (`/docs`).
- **Đa ngôn ngữ**: `nestjs-i18n` (mặc định Tiếng Việt `vi` và Tiếng Anh `en`).
- **Container**: Docker & Docker Compose (`postgres`, `maildev`, `adminer`).

---

## 📁 Cấu trúc thư mục module chính
- `src/auth/`: Module xác thực JWT, refresh token, đăng nhập email/mật khẩu.
- `src/auth-google/`: Đăng nhập bằng tài khoản Google OAuth 2.0.
- `src/auth-github/`: Đăng nhập bằng tài khoản GitHub OAuth 2.0.
- `src/users/`: Quản lý thông tin tài khoản người dùng, vai trò (Admin, User), ngôn ngữ ưa thích (`locale`).
- `src/courses/`: Quản lý danh sách khóa học và nội dung song ngữ.
- `src/lessons/`: Quản lý bài học, lý thuyết markdown và tiến độ hoàn thành bài.
- `src/quizzes/`: Quản lý trắc nghiệm, chấm điểm tự động và lịch sử làm bài.
- `src/labs/`: Quản lý bài thực hành SQL, sandbox thực thi truy vấn và chấm bài tự động.
- `src/datasets/`: Dữ liệu mẫu (sample datasets) phục vụ sandbox lab.

---

## ⚡ Hướng dẫn cài đặt & Khởi chạy

### 1. Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Cập nhật thông tin kết nối PostgreSQL trong `.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=sqlhub
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Chạy cơ sở dữ liệu qua Docker Compose
```bash
docker compose up -d postgres maildev adminer
```
- PostgreSQL: `localhost:5432`
- Adminer (quản lý DB qua web): `http://localhost:8080`
- Maildev (xem email test): `http://localhost:1080`

### 4. Chạy Migration & Seed dữ liệu
```bash
npm run migration:run
npm run seed:run
```

### 5. Khởi chạy ứng dụng Backend
```bash
npm run start:dev
```
- REST API Server: `http://localhost:3001`
- Swagger API Docs: `http://localhost:3001/docs`

---

## 👥 Phân công nhiệm vụ nhóm (Theo SRS v2.2)
- **Lead**: Khung dự án, xác thực (Google/GitHub), review PR, tích hợp hệ thống.
- **Đặng Nguyễn Phúc Khang (M1)**: Module khóa học (`courses`), bài học (`lessons`), tiến độ học tập (`lesson_progress`).
- **Đỗ Trung Tú (M2)**: Module trắc nghiệm (`quizzes`), chấm điểm tự động, lịch sử làm bài.
- **Lê Văn Minh (M3)**: Module lab thực hành (`labs`), sandbox thực thi SQL, cơ chế chấm bài tự động.
- **Nguyễn Hoàng Quốc Thắng (M4)**: Trang quản trị (`admin`), dữ liệu seed song ngữ, kiểm tra i18n vi/en.

Xem chi tiết quy trình phát triển và checklist 7 bước tại [CLAUDE.md](CLAUDE.md).
