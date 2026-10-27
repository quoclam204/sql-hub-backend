import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { CourseTranslationEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course-translation.entity';

@Injectable()
export class CourseSeedService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepository: Repository<CourseEntity>,
    @InjectRepository(CourseTranslationEntity)
    private courseTranslationRepository: Repository<CourseTranslationEntity>,
  ) {}

  async run() {
    const count = await this.courseRepository.count();

    if (count === 0) {
      const initialCourses = [
        {
          slug: 'sql-co-ban',
          order: 1,
          isPublished: true,
          translations: [
            {
              locale: 'vi',
              title: '1. SQL Cơ bản',
              description: 'Làm quen với cú pháp SQL căn bản: SELECT, WHERE, ORDER BY, LIMIT.',
            },
            {
              locale: 'en',
              title: '1. SQL Basics',
              description: 'Learn foundational SQL syntax: SELECT, WHERE, ORDER BY, LIMIT.',
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
              description: 'Kết hợp nhiều bảng với INNER/LEFT/RIGHT JOIN và tổng hợp số liệu với GROUP BY, HAVING.',
            },
            {
              locale: 'en',
              title: '2. JOINs & Data Grouping',
              description: 'Combine tables with INNER/LEFT/RIGHT JOIN and aggregate with GROUP BY, HAVING.',
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
              description: 'Kỹ thuật Subqueries nâng cao và hiểu biết về cấu trúc bảng DDL.',
            },
            {
              locale: 'en',
              title: '3. Subqueries & Table Design',
              description: 'Advanced Subquery techniques and understanding DDL table structures.',
            },
          ],
        },
      ];

      for (const item of initialCourses) {
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
      }
    }
  }
}
