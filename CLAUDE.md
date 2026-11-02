# Hướng Dẫn Phát Triển Dự Án SQL Hub Backend (CLAUDE.md)

Tài liệu hướng dẫn phát triển và quy chuẩn làm việc cho nhóm kỹ thuật (1 Lead + 4 thành viên), tuân theo đặc tả phần mềm **SRS-SQLHub v2.2**.

---

## 1. Tổng quan dự án
- **Tên dự án**: SQL Hub Backend (REST API).
- **Mục tiêu**: Nền tảng học và luyện tập SQL song ngữ Việt - Anh, thực hành qua bài học, trắc nghiệm và lab sandbox.
- **Công nghệ cốt lõi**:
  - **Framework**: NestJS (TypeScript).
  - **Cơ sở dữ liệu**: PostgreSQL (TypeORM). *Tuyệt đối không dùng MongoDB*.
  - **Xác thực (Auth)**: JWT qua Header `Authorization: Bearer <token>`, refresh token; hỗ trợ Google OAuth, GitHub OAuth và Email/Password.
  - **Đa ngôn ngữ (i18n)**: Mặc định tiếng Việt (`vi`) và tiếng Anh (`en`).
  - **Tài liệu API**: Swagger OpenAPI tại `/docs`.

---

## 2. Phân công công việc (Thư mục module)
Mỗi thành viên phụ trách theo chiều dọc (Vertical Slice) trong thư mục riêng để tránh xung đột khi merge:

| Thành viên | Phạm vi chính | Thư mục backend | Mô hình dữ liệu |
|---|---|---|---|
| **Lead** | Khung dự án, xác thực, kiến trúc, review PR, CI/CD | `src/auth`, `src/auth-google`, `src/auth-github`, `src/users` | `users`, `roles`, `statuses` |
| **Đặng Nguyễn Phúc Khang** (M1) | Module khóa học, bài học, tiến độ học viên | `src/courses`, `src/lessons` | `courses`, `course_translations`, `lessons`, `lesson_translations`, `lesson_progress` |
| **Đỗ Trung Tú** (M2) | Module trắc nghiệm, chấm trắc nghiệm tự động | `src/quizzes` | `quizzes`, `quiz_questions`, `question_options`, `quiz_attempts` |
| **Lê Văn Minh** (M3) | Module lab, sandbox SQL, chấm điểm bài tập SQL | `src/labs`, `src/datasets` | `labs`, `datasets`, `lab_submissions` |
| **Nguyễn Hoàng Quốc Thắng** (M4) | Module quản trị nội dung (admin), dữ liệu seed, i18n | `src/admin`, `src/database/seeds` | CRUD nội dung, seed song ngữ vi/en |

---

## 3. Checklist "Thêm một tính năng trong 7 bước" (Bắt buộc cho mọi PR)
1. **Tạo nhánh**: Nhánh tính năng đặt tên theo chuẩn `feat/<module>-<mô tả>` tách từ nhánh `develop`.
2. **Schema & Migration**:
   - Viết hoặc sinh entity TypeORM (`npm run generate:resource` hoặc tạo trong module).
   - Tạo migration: `npm run migration:generate -- src/database/migrations/<TenMigration>`.
   - Chạy migration: `npm run migration:run`.
3. **Viết API & Swagger**: Viết controller, service, DTO có gắn đầy đủ decorator Swagger (`@ApiTags`, `@ApiOkResponse`, `@ApiProperty`).
4. **Phối hợp Frontend**: Frontend chạy `npm run gen:api` từ Swagger OpenAPI để tự động đồng bộ TypeScript types.
5. **Đa ngôn ngữ**: Nội dung hỗ trợ hoặc lưu đa ngôn ngữ (`vi` và `en`).
6. **Kiểm thử**: Viết unit test hoặc E2E test cho logic (đặc biệt phần chấm điểm và xác thực).
7. **Mở Pull Request**: Mở PR vào `develop`, bắt buộc điền phần **"AI đã giúp gì"** (Prompt chính, phần AI sinh, phần người sửa).

---

## 4. Các lệnh phát triển thường dùng
```bash
# Cài đặt dependency
npm install

# Khởi chạy dev server (watch mode)
npm run start:dev

# Cơ sở dữ liệu TypeORM (PostgreSQL)
npm run migration:generate -- src/database/migrations/<TenMigration>
npm run migration:run
npm run migration:revert

# Sinh resource mới bằng Hygen CLI
npm run generate:resource

# Chạy seed dữ liệu
npm run seed:run

# Chạy test
npm run test
npm run test:e2e
```

---

## 5. Bộ công cụ AI first
- Lệnh `/new-feature`: `.claude/commands/new-feature.md` dựng khung tính năng theo checklist 7 bước.
- Lệnh `/ai-log`: `.claude/commands/ai-log.md` ghi bằng chứng dùng AI vào `docs/ai-log.md`.
- Skill soạn nội dung song ngữ: `.claude/skills/lesson-content/SKILL.md`.
- Skill review PR: `.claude/skills/pr-review/SKILL.md`.
- Hook chặn secret: `scripts/check-secrets.js`, chạy tự động trong `.husky/pre-commit` và CI.
- Nhật ký AI: `docs/ai-log.md` (mỗi PR có mục "AI đã giúp gì", tổng hợp mỗi tuần).

---

## 6. Quy tắc và những điều KHÔNG ĐƯỢC LÀM
- **KHÔNG** đưa MongoDB / Mongoose quay trở lại dự án.
- **KHÔNG** lưu token vào cookie; client bắt buộc gửi qua header `Authorization: Bearer <token>`.
- **KHÔNG** commit API secret, OAuth client secret hoặc thông tin nhạy cảm vào git.
- **KHÔNG** cho phép người học chạy lệnh ghi (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`) trong sandbox lab; chỉ cho phép câu truy vấn đọc (`SELECT`).
- Tuân thủ chuẩn **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
