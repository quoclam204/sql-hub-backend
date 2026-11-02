import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { LessonEntity } from '../../../../lessons/infrastructure/persistence/relational/entities/lesson.entity';

type LessonSeed = {
  slug: string;
  order: number;
  vi: { title: string; contentMd: string };
  en: { title: string; contentMd: string };
};

const lessonsByCourse: { courseSlug: string; lessons: LessonSeed[] }[] = [
  {
    courseSlug: 'sql-co-ban',
    lessons: [
      {
        slug: 'gioi-thieu-sql',
        order: 1,
        vi: {
          title: 'Giới thiệu SQL',
          contentMd: `# Giới thiệu SQL

SQL (Structured Query Language) là ngôn ngữ dùng để làm việc với cơ sở dữ liệu quan hệ.

## Các nhóm lệnh chính

- **DQL**: truy vấn dữ liệu, ví dụ \`SELECT\`.
- **DML**: thay đổi dữ liệu, ví dụ \`INSERT\`, \`UPDATE\`, \`DELETE\`.
- **DDL**: định nghĩa cấu trúc, ví dụ \`CREATE\`, \`ALTER\`, \`DROP\`.

Trong SQL Hub, sandbox chỉ cho phép chạy câu lệnh đọc (\`SELECT\`).

~~~sql
SELECT 1 AS hello;
~~~`,
        },
        en: {
          title: 'Introduction to SQL',
          contentMd: `# Introduction to SQL

SQL (Structured Query Language) is the language used to work with relational databases.

## Main command groups

- **DQL**: read data, for example \`SELECT\`.
- **DML**: modify data, for example \`INSERT\`, \`UPDATE\`, \`DELETE\`.
- **DDL**: define structure, for example \`CREATE\`, \`ALTER\`, \`DROP\`.

In SQL Hub, the sandbox only allows read-only (\`SELECT\`) statements.

~~~sql
SELECT 1 AS hello;
~~~`,
        },
      },
      {
        slug: 'select-co-ban',
        order: 2,
        vi: {
          title: 'Câu lệnh SELECT cơ bản',
          contentMd: `# Câu lệnh SELECT cơ bản

Câu lệnh \`SELECT\` dùng để lấy dữ liệu từ một hoặc nhiều bảng.

~~~sql
SELECT first_name, last_name
FROM students;
~~~

Có thể dùng \`*\` để lấy tất cả cột, nhưng trong dự án thật nên liệt kê rõ cột cần dùng để tránh tải dữ liệu thừa.`,
        },
        en: {
          title: 'Basic SELECT',
          contentMd: `# Basic SELECT

The \`SELECT\` statement reads data from one or more tables.

~~~sql
SELECT first_name, last_name
FROM students;
~~~

You can use \`*\` to select every column, but in real projects list only the columns you need.`,
        },
      },
      {
        slug: 'where-loc-du-lieu',
        order: 3,
        vi: {
          title: 'Lọc dữ liệu với WHERE',
          contentMd: `# Lọc dữ liệu với WHERE

Mệnh đề \`WHERE\` giúp chỉ lấy những dòng thỏa điều kiện.

~~~sql
SELECT *
FROM students
WHERE age >= 18;
~~~

Các toán tử thường dùng: \`=\`, \`<>\`, \`>\`, \`<\`, \`>=\`, \`<=\`, \`LIKE\`, \`IN\`, \`BETWEEN\`, \`IS NULL\`.`,
        },
        en: {
          title: 'Filtering with WHERE',
          contentMd: `# Filtering with WHERE

The \`WHERE\` clause keeps only rows that match a condition.

~~~sql
SELECT *
FROM students
WHERE age >= 18;
~~~

Common operators: \`=\`, \`<>\`, \`>\`, \`<\`, \`>=\`, \`<=\`, \`LIKE\`, \`IN\`, \`BETWEEN\`, \`IS NULL\`.`,
        },
      },
      {
        slug: 'order-by-va-limit',
        order: 4,
        vi: {
          title: 'Sắp xếp và giới hạn kết quả',
          contentMd: `# Sắp xếp và giới hạn kết quả

- \`ORDER BY\` sắp xếp kết quả tăng dần (\`ASC\`) hoặc giảm dần (\`DESC\`).
- \`LIMIT\` giới hạn số dòng trả về.

~~~sql
SELECT first_name, score
FROM students
ORDER BY score DESC
LIMIT 10;
~~~

Sandbox của SQL Hub giới hạn tối đa 1.000 dòng trả về.`,
        },
        en: {
          title: 'Sorting and limiting results',
          contentMd: `# Sorting and limiting results

- \`ORDER BY\` sorts results ascending (\`ASC\`) or descending (\`DESC\`).
- \`LIMIT\` caps the number of returned rows.

~~~sql
SELECT first_name, score
FROM students
ORDER BY score DESC
LIMIT 10;
~~~

The SQL Hub sandbox returns at most 1,000 rows.`,
        },
      },
      {
        slug: 'ham-tong-hop-co-ban',
        order: 5,
        vi: {
          title: 'Hàm tổng hợp cơ bản',
          contentMd: `# Hàm tổng hợp cơ bản

Các hàm tổng hợp nhận nhiều dòng và trả về một giá trị:

- \`COUNT()\`: đếm số dòng.
- \`SUM()\`: tính tổng.
- \`AVG()\`: tính trung bình.
- \`MIN()\`, \`MAX()\`: giá trị nhỏ nhất, lớn nhất.

~~~sql
SELECT COUNT(*) AS total_students,
       AVG(score) AS average_score
FROM students;
~~~`,
        },
        en: {
          title: 'Basic aggregate functions',
          contentMd: `# Basic aggregate functions

Aggregate functions take many rows and return a single value:

- \`COUNT()\`: count rows.
- \`SUM()\`: total.
- \`AVG()\`: average.
- \`MIN()\`, \`MAX()\`: smallest and largest values.

~~~sql
SELECT COUNT(*) AS total_students,
       AVG(score) AS average_score
FROM students;
~~~`,
        },
      },
    ],
  },
  {
    courseSlug: 'join-va-nhom-du-lieu',
    lessons: [
      {
        slug: 'inner-join',
        order: 1,
        vi: {
          title: 'INNER JOIN',
          contentMd: `# INNER JOIN

\`INNER JOIN\` trả về các dòng có dữ liệu khớp ở cả hai bảng.

~~~sql
SELECT s.first_name, c.name AS class_name
FROM students AS s
INNER JOIN classes AS c ON c.id = s.class_id;
~~~

Nếu một học viên chưa được xếp lớp, học viên đó sẽ không xuất hiện trong kết quả.`,
        },
        en: {
          title: 'INNER JOIN',
          contentMd: `# INNER JOIN

\`INNER JOIN\` returns rows that match in both tables.

~~~sql
SELECT s.first_name, c.name AS class_name
FROM students AS s
INNER JOIN classes AS c ON c.id = s.class_id;
~~~

Students without a class do not appear in the result.`,
        },
      },
      {
        slug: 'left-right-join',
        order: 2,
        vi: {
          title: 'LEFT JOIN và RIGHT JOIN',
          contentMd: `# LEFT JOIN và RIGHT JOIN

- \`LEFT JOIN\` giữ tất cả dòng của bảng bên trái.
- \`RIGHT JOIN\` giữ tất cả dòng của bảng bên phải.

~~~sql
SELECT s.first_name, c.name AS class_name
FROM students AS s
LEFT JOIN classes AS c ON c.id = s.class_id;
~~~

Cột không khớp sẽ có giá trị \`NULL\`.`,
        },
        en: {
          title: 'LEFT JOIN and RIGHT JOIN',
          contentMd: `# LEFT JOIN and RIGHT JOIN

- \`LEFT JOIN\` keeps every row from the left table.
- \`RIGHT JOIN\` keeps every row from the right table.

~~~sql
SELECT s.first_name, c.name AS class_name
FROM students AS s
LEFT JOIN classes AS c ON c.id = s.class_id;
~~~

Unmatched columns are \`NULL\`.`,
        },
      },
      {
        slug: 'group-by',
        order: 3,
        vi: {
          title: 'Nhóm dữ liệu với GROUP BY',
          contentMd: `# Nhóm dữ liệu với GROUP BY

\`GROUP BY\` gom các dòng có cùng giá trị thành một nhóm trước khi tính toán.

~~~sql
SELECT class_id, COUNT(*) AS student_count
FROM students
GROUP BY class_id;
~~~

Mọi cột không nằm trong hàm tổng hợp phải xuất hiện trong \`GROUP BY\`.`,
        },
        en: {
          title: 'Grouping with GROUP BY',
          contentMd: `# Grouping with GROUP BY

\`GROUP BY\` groups rows with the same value before aggregation.

~~~sql
SELECT class_id, COUNT(*) AS student_count
FROM students
GROUP BY class_id;
~~~

Every column that is not aggregated must appear in \`GROUP BY\`.`,
        },
      },
      {
        slug: 'having',
        order: 4,
        vi: {
          title: 'Lọc nhóm với HAVING',
          contentMd: `# Lọc nhóm với HAVING

\`WHERE\` lọc trước khi nhóm, còn \`HAVING\` lọc sau khi nhóm.

~~~sql
SELECT class_id, AVG(score) AS average_score
FROM students
GROUP BY class_id
HAVING AVG(score) >= 8;
~~~`,
        },
        en: {
          title: 'Filtering groups with HAVING',
          contentMd: `# Filtering groups with HAVING

\`WHERE\` filters before grouping, while \`HAVING\` filters after grouping.

~~~sql
SELECT class_id, AVG(score) AS average_score
FROM students
GROUP BY class_id
HAVING AVG(score) >= 8;
~~~`,
        },
      },
      {
        slug: 'bai-tap-tong-hop-join',
        order: 5,
        vi: {
          title: 'Bài tập tổng hợp JOIN',
          contentMd: `# Bài tập tổng hợp JOIN

Viết truy vấn trả về tên lớp, số học viên và điểm trung bình của từng lớp, chỉ lấy các lớp có ít nhất 3 học viên.

~~~sql
SELECT c.name AS class_name,
       COUNT(s.id) AS student_count,
       AVG(s.score) AS average_score
FROM classes AS c
LEFT JOIN students AS s ON s.class_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(s.id) >= 3;
~~~

Hãy thử chạy trong lab để so sánh kết quả với đáp án.`,
        },
        en: {
          title: 'JOIN practice',
          contentMd: `# JOIN practice

Write a query that returns class name, student count, and average score per class, keeping only classes with at least 3 students.

~~~sql
SELECT c.name AS class_name,
       COUNT(s.id) AS student_count,
       AVG(s.score) AS average_score
FROM classes AS c
LEFT JOIN students AS s ON s.class_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(s.id) >= 3;
~~~

Try it in the lab and compare the result with the expected answer.`,
        },
      },
    ],
  },
  {
    courseSlug: 'truy-van-con-va-thiet-ke-bang',
    lessons: [
      {
        slug: 'subquery-co-ban',
        order: 1,
        vi: {
          title: 'Truy vấn con cơ bản',
          contentMd: `# Truy vấn con cơ bản

Truy vấn con là một câu \`SELECT\` nằm bên trong câu \`SELECT\` khác.

~~~sql
SELECT first_name, score
FROM students
WHERE score > (SELECT AVG(score) FROM students);
~~~

Truy vấn con có thể trả về một giá trị, một cột hoặc một bảng.`,
        },
        en: {
          title: 'Basic subqueries',
          contentMd: `# Basic subqueries

A subquery is a \`SELECT\` statement nested inside another statement.

~~~sql
SELECT first_name, score
FROM students
WHERE score > (SELECT AVG(score) FROM students);
~~~

A subquery can return a single value, a column, or a table.`,
        },
      },
      {
        slug: 'subquery-tuong-quan',
        order: 2,
        vi: {
          title: 'Truy vấn con tương quan',
          contentMd: `# Truy vấn con tương quan

Truy vấn con tương quan tham chiếu đến cột của truy vấn bên ngoài và được chạy lại cho từng dòng.

~~~sql
SELECT s.first_name, s.score
FROM students AS s
WHERE s.score > (
  SELECT AVG(s2.score)
  FROM students AS s2
  WHERE s2.class_id = s.class_id
);
~~~`,
        },
        en: {
          title: 'Correlated subqueries',
          contentMd: `# Correlated subqueries

A correlated subquery references a column from the outer query and runs again for each row.

~~~sql
SELECT s.first_name, s.score
FROM students AS s
WHERE s.score > (
  SELECT AVG(s2.score)
  FROM students AS s2
  WHERE s2.class_id = s.class_id
);
~~~`,
        },
      },
      {
        slug: 'cte',
        order: 3,
        vi: {
          title: 'Common Table Expressions',
          contentMd: `# Common Table Expressions

\`WITH\` tạo một bảng tạm có tên để câu truy vấn dễ đọc hơn.

~~~sql
WITH class_average AS (
  SELECT class_id, AVG(score) AS average_score
  FROM students
  GROUP BY class_id
)
SELECT *
FROM class_average
WHERE average_score >= 8;
~~~`,
        },
        en: {
          title: 'Common Table Expressions',
          contentMd: `# Common Table Expressions

\`WITH\` defines a named temporary result set that makes complex queries easier to read.

~~~sql
WITH class_average AS (
  SELECT class_id, AVG(score) AS average_score
  FROM students
  GROUP BY class_id
)
SELECT *
FROM class_average
WHERE average_score >= 8;
~~~`,
        },
      },
      {
        slug: 'khoa-chinh-khoa-ngoai',
        order: 4,
        vi: {
          title: 'Khóa chính và khóa ngoại',
          contentMd: `# Khóa chính và khóa ngoại

- **Khóa chính (Primary Key)**: định danh duy nhất mỗi dòng.
- **Khóa ngoại (Foreign Key)**: tham chiếu đến khóa chính của bảng khác.

~~~sql
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  class_id INTEGER REFERENCES classes(id)
);
~~~

Khóa ngoại giúp đảm bảo tính toàn vẹn dữ liệu giữa các bảng.`,
        },
        en: {
          title: 'Primary and foreign keys',
          contentMd: `# Primary and foreign keys

- **Primary Key**: uniquely identifies each row.
- **Foreign Key**: references the primary key of another table.

~~~sql
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  class_id INTEGER REFERENCES classes(id)
);
~~~

Foreign keys protect data integrity across tables.`,
        },
      },
      {
        slug: 'chuan-hoa-du-lieu',
        order: 5,
        vi: {
          title: 'Chuẩn hóa dữ liệu',
          contentMd: `# Chuẩn hóa dữ liệu

Chuẩn hóa giúp giảm dư thừa và tránh dữ liệu không nhất quán.

- **1NF**: mỗi ô chỉ chứa một giá trị nguyên tử.
- **2NF**: không có phụ thuộc một phần vào khóa chính.
- **3NF**: không có phụ thuộc bắc cầu giữa các cột không khóa.

Ví dụ: tách thông tin lớp học ra bảng \`classes\` thay vì lặp lại tên lớp trong bảng \`students\`.`,
        },
        en: {
          title: 'Data normalization',
          contentMd: `# Data normalization

Normalization reduces redundancy and prevents inconsistent data.

- **1NF**: each cell holds a single atomic value.
- **2NF**: no partial dependency on the primary key.
- **3NF**: no transitive dependency between non-key columns.

Example: move class information into a \`classes\` table instead of repeating the class name in \`students\`.`,
        },
      },
    ],
  },
];

@Injectable()
export class LessonSeedService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonRepository: Repository<LessonEntity>,
  ) {}

  async run() {
    const count = await this.lessonRepository.count();

    if (count > 0) {
      return;
    }

    for (const group of lessonsByCourse) {
      const course = await this.courseRepository.findOne({
        where: { slug: group.courseSlug },
      });

      if (!course) {
        continue;
      }

      for (const lesson of group.lessons) {
        await this.lessonRepository.save(
          this.lessonRepository.create({
            courseId: course.id,
            slug: lesson.slug,
            order: lesson.order,
            translations: [
              {
                locale: 'vi',
                title: lesson.vi.title,
                contentMd: lesson.vi.contentMd,
              },
              {
                locale: 'en',
                title: lesson.en.title,
                contentMd: lesson.en.contentMd,
              },
            ],
          }),
        );
      }
    }
  }
}
