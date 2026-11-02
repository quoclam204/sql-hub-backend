# Đề Cương Bộ Câu Hỏi Trắc Nghiệm SQL Song Ngữ (SQL Hub)
- **Người thực hiện:** Đỗ Trung Tú (Module FR-QUIZ)
- **Phiên bản:** 1.0 (Tuần 1)
- **Mục tiêu:** 3 khóa học × 5 bài học × 3 câu hỏi = 45 câu hỏi trắc nghiệm song ngữ (vi/en) có chấm điểm tự động và lời giải thích chi tiết.

---

## 1. Ma trận 45 Câu hỏi theo Lộ trình 3 Khóa học

### Khóa 1: SQL Cơ bản (`sql-basics`)
| Bài học (`lesson_slug`) | Tiêu đề bài học (VI / EN) | Trọng tâm 3 câu hỏi trắc nghiệm |
| :--- | :--- | :--- |
| **`01-select-from`** | Truy vấn dữ liệu với `SELECT` & `FROM` / *Querying Data with `SELECT` & `FROM`* | • **Q1:** Thứ tự thực thi logic giữa `FROM` và `SELECT`.<br>• **Q2:** Rủi ro hiệu năng khi lạm dụng `SELECT *` trong thực tế.<br>• **Q3:** Đặt bí danh cột (Alias) có khoảng trắng bằng dấu nháy kép `"..."`. |
| **`02-where-filtering`** | Lọc dữ liệu với `WHERE` / *Filtering Data with `WHERE`* | • **Q1:** Toán tử so sánh khác nhau trong chuẩn SQL (`<>` và `!=`).<br>• **Q2:** Thứ tự ưu tiên toán tử logic (`AND` ưu tiên hơn `OR`).<br>• **Q3:** Cơ chế bao gồm cả 2 đầu mút của toán tử `BETWEEN ... AND ...`. |
| **`03-order-limit`** | Sắp xếp & Giới hạn (`ORDER BY`, `LIMIT`, `OFFSET`) / *Sorting & Limiting Results* | • **Q1:** Chiều sắp xếp mặc định của `ORDER BY` (`ASC`).<br>• **Q2:** Sắp xếp nhiều cột kết hợp (`ORDER BY a ASC, b DESC`).<br>• **Q3:** Công thức phân trang sử dụng cặp `LIMIT` và `OFFSET`. |
| **`04-null-pattern`** | Xử lý `NULL` & So khớp mẫu (`LIKE`, `ILIKE`) / *Handling `NULL` & Pattern Matching* | • **Q1:** Quy tắc bắt buộc dùng `IS NULL` thay vì `= NULL`.<br>• **Q2:** Phân biệt ký tự đại diện `%` (0 hoặc nhiều ký tự) và `_` (đúng 1 ký tự).<br>• **Q3:** Cách hoạt động của hàm thay thế giá trị `COALESCE()`. |
| **`05-distinct-functions`** | Loại bỏ trùng lặp (`DISTINCT`) & Hàm cơ bản / *Removing Duplicates & Built-in Functions* | • **Q1:** Cách `SELECT DISTINCT col1, col2` xét duy nhất trên bộ tổ hợp giá trị.<br>• **Q2:** Các hàm xử lý chuỗi phổ biến (`UPPER`, `LOWER`, `LENGTH`).<br>• **Q3:** Ép kiểu dữ liệu bằng `CAST(x AS type)` hoặc cú pháp `::` trong PostgreSQL. |

---

### Khóa 2: JOIN và Nhóm dữ liệu (`joins-and-aggregation`)
| Bài học (`lesson_slug`) | Tiêu đề bài học (VI / EN) | Trọng tâm 3 câu hỏi trắc nghiệm |
| :--- | :--- | :--- |
| **`01-aggregate-functions`** | Các hàm tổng hợp (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) / *Aggregate Functions* | • **Q1:** Khác biệt giữa `COUNT(*)` và `COUNT(col)` khi gặp giá trị `NULL`.<br>• **Q2:** Cơ chế của hàm `AVG()` (tự động bỏ qua dòng `NULL` chứ không tính là 0).<br>• **Q3:** Đếm giá trị phân biệt với `COUNT(DISTINCT col)`. |
| **`02-group-by-having`** | Gom nhóm `GROUP BY` & Lọc nhóm với `HAVING` / *Grouping Data with `GROUP BY` & `HAVING`* | • **Q1:** Quy tắc các cột trên mệnh đề `SELECT` khi có `GROUP BY`.<br>• **Q2:** Phân biệt thời điểm lọc: `WHERE` (trước gom nhóm) vs `HAVING` (sau gom nhóm).<br>• **Q3:** Lý do không thể dùng hàm tổng hợp trong mệnh đề `WHERE`. |
| **`03-inner-left-join`** | Kết nối bảng với `INNER JOIN` và `LEFT JOIN` / *Combining Tables with `INNER` & `LEFT JOIN`* | • **Q1:** Tập kết quả trả về của `INNER JOIN` khi không có khóa khớp.<br>• **Q2:** Giá trị các cột ở bảng bên phải trong `LEFT JOIN` khi không khớp (`NULL`).<br>• **Q3:** Tìm các bản ghi không tồn tại bằng `LEFT JOIN ... WHERE B.id IS NULL`. |
| **`04-full-cross-self-join`** | `RIGHT JOIN`, `FULL OUTER JOIN`, `CROSS JOIN` & `SELF JOIN` / *Advanced Joins* | • **Q1:** Số lượng dòng kết quả của `CROSS JOIN` (tích Descartes $M \times N$).<br>• **Q2:** Mục đích của `SELF JOIN` trong quan hệ phân cấp (bảng nhân viên tự tham chiếu).<br>• **Q3:** Khác biệt giữa điều kiện lọc đặt ở mệnh đề `ON` vs `WHERE` trong `LEFT JOIN`. |
| **`05-set-operations`** | Phép toán tập hợp (`UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT`) / *Set Operations* | • **Q1:** Khác biệt về chi phí hiệu năng và kết quả giữa `UNION` (loại trùng) và `UNION ALL`.<br>• **Q2:** Ràng buộc về số cột và kiểu dữ liệu tương thích giữa các câu lệnh `SELECT`.<br>• **Q3:** Ý nghĩa của phép trừ tập hợp `EXCEPT` trong PostgreSQL. |

---

### Khóa 3: Truy vấn con và Thiết kế bảng (`subqueries-and-schema-design`)
| Bài học (`lesson_slug`) | Tiêu đề bài học (VI / EN) | Trọng tâm 3 câu hỏi trắc nghiệm |
| :--- | :--- | :--- |
| **`01-scalar-table-subqueries`** | Truy vấn con vô hướng & đa dòng (`IN`, `ANY`, `ALL`) / *Scalar & Multi-row Subqueries* | • **Q1:** Lỗi Runtime khi Scalar Subquery trả về nhiều hơn 1 dòng.<br>• **Q2:** Bẫy logic khi dùng `NOT IN` với tập subquery có chứa giá trị `NULL`.<br>• **Q3:** Bắt buộc phải đặt Alias cho Derived Table (subquery trong mệnh đề `FROM`). |
| **`02-correlated-exists`** | Truy vấn con tương quan & Toán tử `EXISTS` / *Correlated Subqueries & `EXISTS`* | • **Q1:** Cơ chế thực thi lặp lại của Correlated Subquery theo từng dòng ngoài.<br>• **Q2:** Tối ưu hóa hiệu năng của `EXISTS` so với `IN` (cơ chế dừng sớm Short-circuit).<br>• **Q3:** Ý nghĩa của việc dùng `SELECT 1` bên trong mệnh đề `EXISTS`. |
| **`03-cte-with`** | Biểu thức bảng chung (`CTE - WITH`) / *Common Table Expressions (CTEs)* | • **Q1:** Tác dụng của CTE (`WITH`) trong việc tăng tính tường minh so với Subquery lồng nhau.<br>• **Q2:** Phạm vi hiệu lực của một CTE (chỉ nằm trong câu lệnh thực thi ngay sau nó).<br>• **Q3:** Cấu trúc thành phần của một Recursive CTE (Anchor Member + Recursive Member). |
| **`04-datatypes-constraints`** | Kiểu dữ liệu & Ràng buộc toàn vẹn (`PK`, `FK`, `UNIQUE`, `CHECK`) / *Data Types & Constraints* | • **Q1:** Khác biệt giữa `PRIMARY KEY` (chỉ 1, không `NULL`) và `UNIQUE` (cho phép `NULL`).<br>• **Q2:** Toàn vẹn tham chiếu của `FOREIGN KEY` và hành vi của tùy chọn `ON DELETE CASCADE`.<br>• **Q3:** Lựa chọn `NUMERIC`/`DECIMAL` thay cho `FLOAT` để tránh sai số dấu phẩy động khi lưu tiền tệ. |
| **`05-normalization-indexes`** | Chuẩn hóa dữ liệu (1NF, 2NF, 3NF) & Đánh chỉ mục (`INDEX`) / *Normalization & Indexing* | • **Q1:** Điều kiện thỏa mãn dạng chuẩn 1 (1NF - nguyên tử hóa dữ liệu).<br>• **Q2:** Giải pháp bảng trung gian (Junction Table) cho mối quan hệ Nhiều-Nhiều ($N-N$).<br>• **Q3:** Đánh đổi chi phí khi đánh `INDEX` (tăng tốc độ `SELECT` nhưng làm chậm `INSERT/UPDATE`). |

---

## 2. Cấu trúc Mẫu JSON Seed (Song ngữ `vi`/`en` cho Bài 1 - Khóa 1)

```json
{
  "courseSlug": "sql-basics",
  "lessonSlug": "01-select-from",
  "quiz": {
    "isPublished": true,
    "questions": [
      {
        "order": 1,
        "questionType": "SINGLE_CHOICE",
        "translations": {
          "vi": {
            "questionText": "Trong một câu truy vấn SQL cơ bản gồm hai mệnh đề SELECT và FROM, hệ quản trị cơ sở dữ liệu sẽ thực thi mệnh đề nào trước?",
            "explanation": "Hệ quản trị CSDL phải thực thi mệnh đề FROM trước để xác định bảng dữ liệu nguồn, sau đó mới thực thi SELECT để trích xuất các cột được yêu cầu."
          },
          "en": {
            "questionText": "In a basic SQL query containing both SELECT and FROM clauses, which clause does the database engine logically execute first?",
            "explanation": "The database engine must evaluate the FROM clause first to identify the source table before executing the SELECT clause to project the requested columns."
          }
        },
        "options": [
          {
            "order": 1,
            "isCorrect": false,
            "translations": {
              "vi": "Mệnh đề SELECT chạy trước để biết cần lấy cột nào",
              "en": "The SELECT clause runs first to determine which columns are needed"
            }
          },
          {
            "order": 2,
            "isCorrect": true,
            "translations": {
              "vi": "Mệnh đề FROM chạy trước để xác định bảng dữ liệu nguồn",
              "en": "The FROM clause runs first to identify the source table"
            }
          },
          {
            "order": 3,
            "isCorrect": false,
            "translations": {
              "vi": "Cả hai mệnh đề chạy song song cùng một lúc",
              "en": "Both clauses are executed simultaneously in parallel"
            }
          },
          {
            "order": 4,
            "isCorrect": false,
            "translations": {
              "vi": "Tùy thuộc vào số lượng dòng trong bảng",
              "en": "It depends on the number of rows in the table"
            }
          }
        ]
      },
      {
        "order": 2,
        "questionType": "SINGLE_CHOICE",
        "translations": {
          "vi": {
            "questionText": "Tại sao trong môi trường thực tế (Production), lập trình viên được khuyên hạn chế sử dụng câu lệnh `SELECT * FROM users`?",
            "explanation": "`SELECT *` lấy toàn bộ các cột (kể cả các cột nặng hoặc nhạy cảm không cần thiết), làm tăng băng thông mạng, tốn bộ nhớ và có thể làm mất tác dụng của Covering Index."
          },
          "en": {
            "questionText": "Why is it generally discouraged to use `SELECT * FROM users` in production application code?",
            "explanation": "`SELECT *` retrieves all columns (including unnecessary heavy or sensitive data), increasing network payload, memory usage, and potentially preventing Index-Only Scans."
          }
        },
        "options": [
          {
            "order": 1,
            "isCorrect": false,
            "translations": {
              "vi": "Vì ký tự `*` không được hỗ trợ trong PostgreSQL",
              "en": "Because the `*` character is not supported in PostgreSQL"
            }
          },
          {
            "order": 2,
            "isCorrect": false,
            "translations": {
              "vi": "Vì `SELECT *` chỉ trả về tối đa 100 dòng đầu tiên",
              "en": "Because `SELECT *` only returns the first 100 rows at most"
            }
          },
          {
            "order": 3,
            "isCorrect": true,
            "translations": {
              "vi": "Vì nó tải cả những cột dữ liệu dư thừa, gây tốn băng thông và giảm hiệu năng truy vấn",
              "en": "Because it fetches unnecessary columns, wasting bandwidth and degrading query performance"
            }
          },
          {
            "order": 4,
            "isCorrect": false,
            "translations": {
              "vi": "Vì `SELECT *` sẽ tự động khóa (lock) bảng dữ liệu lại",
              "en": "Because `SELECT *` automatically locks the entire table"
            }
          }
        ]
      },
      {
        "order": 3,
        "questionType": "SINGLE_CHOICE",
        "translations": {
          "vi": {
            "questionText": "Câu lệnh nào sau đây đặt bí danh (Alias) cho cột `first_name` thành `Họ và Tên` đúng chuẩn PostgreSQL (giữ nguyên khoảng trắng và chữ hoa/thường)?",
            "explanation": "Trong chuẩn SQL và PostgreSQL, bí danh cột có chứa khoảng trắng hoặc cần phân biệt chữ hoa/thường phải được đặt trong cặp dấu nháy kép (\"...\"). Dấu nháy đơn ('...') chỉ dùng cho chuỗi ký tự (string literal)."
          },
          "en": {
            "questionText": "Which of the following statements correctly aliases the `first_name` column as `Full Name` in PostgreSQL (preserving spaces and casing)?",
            "explanation": "In standard SQL and PostgreSQL, identifiers or column aliases containing spaces or requiring case sensitivity must be enclosed in double quotes (\"...\"). Single quotes ('...') are strictly for string literals."
          }
        },
        "options": [
          {
            "order": 1,
            "isCorrect": false,
            "translations": {
              "vi": "SELECT first_name AS 'Họ và Tên' FROM users;",
              "en": "SELECT first_name AS 'Full Name' FROM users;"
            }
          },
          {
            "order": 2,
            "isCorrect": true,
            "translations": {
              "vi": "SELECT first_name AS \"Họ và Tên\" FROM users;",
              "en": "SELECT first_name AS \"Full Name\" FROM users;"
            }
          },
          {
            "order": 3,
            "isCorrect": false,
            "translations": {
              "vi": "SELECT first_name AS Họ và Tên FROM users;",
              "en": "SELECT first_name AS Full Name FROM users;"
            }
          },
          {
            "order": 4,
            "isCorrect": false,
            "translations": {
              "vi": "SELECT first_name = \"Họ và Tên\" FROM users;",
              "en": "SELECT first_name = \"Full Name\" FROM users;"
            }
          }
        ]
      }
    ]
  }
}