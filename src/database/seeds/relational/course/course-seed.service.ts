import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { CourseTranslationEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course-translation.entity';
import { LessonEntity } from '../../../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from '../../../../lessons/infrastructure/persistence/relational/entities/lesson-translation.entity';

/**
 * PLACEHOLDER - SQL not yet verified.
 * Full verified lessons and sample dataset will be added in Phase 2.
 *
 * Lesson content uses Markdown with YAML frontmatter:
 * ---
 * title: Bài học tên
 * locale: vi
 * slug: lesson-slug
 * course: course-slug
 * order: 1
 * is_preview: true
 * ---
 *
 * # Nội dung bài học
 * ...
 */
interface LessonSeed {
  slug: string;
  order: number;
  isPreview: boolean;
  translations: Array<{
    locale: string;
    title: string;
    contentMd: string;
  }>;
}

interface CourseSeed {
  slug: string;
  order: number;
  isPublished: boolean;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
  lessons: LessonSeed[];
}

// PLACEHOLDER - SQL not yet verified
const COURSES: CourseSeed[] = [
  {
    slug: 'sql-co-ban',
    order: 1,
    isPublished: true,
    translations: [
      {
        locale: 'vi',
        title: '1. SQL Cơ bản',
        description:
          'Làm quen với cú pháp SQL căn bản: SELECT, WHERE, ORDER BY, LIMIT.',
      },
      {
        locale: 'en',
        title: '1. SQL Basics',
        description:
          'Learn foundational SQL syntax: SELECT, WHERE, ORDER BY, LIMIT.',
      },
    ],
    lessons: [
      // PLACEHOLDER - SQL not yet verified
      {
        slug: 'gioi-thieu-sql',
        order: 1,
        isPreview: true,
        translations: [
          {
            locale: 'vi',
            title: 'Giới thiệu SQL',
            contentMd: `---
title: Giới thiệu SQL
locale: vi
slug: gioi-thieu-sql
course: sql-co-ban
order: 1
is_preview: true
---

<!-- PLACEHOLDER - SQL not yet verified -->
# Giới thiệu SQL

**SQL** (Structured Query Language) là ngôn ngữ chuẩn để làm việc với cơ sở dữ liệu quan hệ.

## SQL dùng để làm gì?

- Truy vấn dữ liệu (\`SELECT\`)
- Chèn dữ liệu (\`INSERT\`)
- Cập nhật dữ liệu (\`UPDATE\`)
- Xóa dữ liệu (\`DELETE\`)

## Câu lệnh SELECT đầu tiên

\`\`\`sql
SELECT * FROM employees;
\`\`\`

> Câu lệnh trên trả về tất cả các cột và hàng trong bảng \`employees\`.
`,
          },
          {
            locale: 'en',
            title: 'Introduction to SQL',
            contentMd: `---
title: Introduction to SQL
locale: en
slug: gioi-thieu-sql
course: sql-co-ban
order: 1
is_preview: true
---

<!-- PLACEHOLDER - SQL not yet verified -->
# Introduction to SQL

**SQL** (Structured Query Language) is the standard language for working with relational databases.

## What is SQL used for?

- Querying data (\`SELECT\`)
- Inserting data (\`INSERT\`)
- Updating data (\`UPDATE\`)
- Deleting data (\`DELETE\`)

## Your first SELECT

\`\`\`sql
SELECT * FROM employees;
\`\`\`

> This returns all columns and rows from the \`employees\` table.
`,
          },
        ],
      },
      // PLACEHOLDER - SQL not yet verified
      {
        slug: 'menh-de-where',
        order: 2,
        isPreview: false,
        translations: [
          {
            locale: 'vi',
            title: 'Mệnh đề WHERE',
            contentMd: `---
title: Mệnh đề WHERE
locale: vi
slug: menh-de-where
course: sql-co-ban
order: 2
is_preview: false
---

<!-- PLACEHOLDER - SQL not yet verified -->
# Mệnh đề WHERE

Mệnh đề \`WHERE\` lọc các hàng thỏa mãn điều kiện.

## Cú pháp

\`\`\`sql
SELECT column1, column2
FROM table_name
WHERE condition;
\`\`\`

## Ví dụ

\`\`\`sql
SELECT first_name, salary
FROM employees
WHERE salary > 5000;
\`\`\`
`,
          },
          {
            locale: 'en',
            title: 'WHERE Clause',
            contentMd: `---
title: WHERE Clause
locale: en
slug: menh-de-where
course: sql-co-ban
order: 2
is_preview: false
---

<!-- PLACEHOLDER - SQL not yet verified -->
# WHERE Clause

The \`WHERE\` clause filters rows that satisfy a condition.

## Syntax

\`\`\`sql
SELECT column1, column2
FROM table_name
WHERE condition;
\`\`\`

## Example

\`\`\`sql
SELECT first_name, salary
FROM employees
WHERE salary > 5000;
\`\`\`
`,
          },
        ],
      },
    ],
  },
  {
    slug: 'join-va-nhom-du-lieu',
    order: 2,
    isPublished: true,
    translations: [
      {
        locale: 'vi',
        title: '2. JOIN và Nhóm Dữ Liệu',
        description:
          'Kết hợp nhiều bảng với INNER/LEFT/RIGHT JOIN và tổng hợp số liệu với GROUP BY, HAVING.',
      },
      {
        locale: 'en',
        title: '2. JOINs & Data Grouping',
        description:
          'Combine tables with INNER/LEFT/RIGHT JOIN and aggregate with GROUP BY, HAVING.',
      },
    ],
    lessons: [
      // PLACEHOLDER - SQL not yet verified
      {
        slug: 'inner-join',
        order: 1,
        isPreview: true,
        translations: [
          {
            locale: 'vi',
            title: 'INNER JOIN',
            contentMd: `---
title: INNER JOIN
locale: vi
slug: inner-join
course: join-va-nhom-du-lieu
order: 1
is_preview: true
---

<!-- PLACEHOLDER - SQL not yet verified -->
# INNER JOIN

\`INNER JOIN\` trả về các hàng có giá trị khớp ở cả hai bảng.

\`\`\`sql
SELECT e.first_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;
\`\`\`
`,
          },
        ],
      },
    ],
  },
  {
    slug: 'truy-van-con-va-thiet-ke-bang',
    order: 3,
    isPublished: true,
    translations: [
      {
        locale: 'vi',
        title: '3. Truy Vấn Con & Thiết Kế Bảng',
        description:
          'Kỹ thuật Subqueries nâng cao và hiểu biết về cấu trúc bảng DDL.',
      },
      {
        locale: 'en',
        title: '3. Subqueries & Table Design',
        description:
          'Advanced Subquery techniques and understanding DDL table structures.',
      },
    ],
    lessons: [],
  },
];

@Injectable()
export class CourseSeedService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepository: Repository<CourseEntity>,
    @InjectRepository(CourseTranslationEntity)
    private courseTranslationRepository: Repository<CourseTranslationEntity>,
    @InjectRepository(LessonEntity)
    private lessonRepository: Repository<LessonEntity>,
    @InjectRepository(LessonTranslationEntity)
    private lessonTranslationRepository: Repository<LessonTranslationEntity>,
  ) {}

  async run() {
    const count = await this.courseRepository.count();
    if (count > 0) return; // idempotent

    for (const item of COURSES) {
      const course = await this.courseRepository.save(
        this.courseRepository.create({
          slug: item.slug,
          order: item.order,
          isPublished: item.isPublished,
        }),
      );

      for (const t of item.translations) {
        await this.courseTranslationRepository.save(
          this.courseTranslationRepository.create({
            courseId: course.id,
            locale: t.locale,
            title: t.title,
            description: t.description,
          }),
        );
      }

      for (const lessonSeed of item.lessons) {
        const lesson = await this.lessonRepository.save(
          this.lessonRepository.create({
            courseId: course.id,
            slug: lessonSeed.slug,
            order: lessonSeed.order,
            isPreview: lessonSeed.isPreview,
          }),
        );

        for (const lt of lessonSeed.translations) {
          await this.lessonTranslationRepository.save(
            this.lessonTranslationRepository.create({
              lessonId: lesson.id,
              locale: lt.locale,
              title: lt.title,
              contentMd: lt.contentMd,
            }),
          );
        }
      }
    }
  }
}
