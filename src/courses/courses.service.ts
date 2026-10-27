import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from './infrastructure/persistence/relational/entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
  ) {}

  async findAll(locale: string = 'vi') {
    const courses = await this.courseRepository.find({
      where: { isPublished: true },
      order: { order: 'ASC' },
      relations: ['translations', 'lessons', 'lessons.translations'],
    });

    return courses.map((course) => {
      const translation =
        course.translations.find((t) => t.locale === locale) ||
        course.translations[0];

      return {
        id: course.id,
        slug: course.slug,
        order: course.order,
        title: translation?.title || course.slug,
        description: translation?.description || '',
        lessonsCount: course.lessons?.length || 0,
      };
    });
  }

  async findBySlug(slug: string, locale: string = 'vi') {
    const course = await this.courseRepository.findOne({
      where: { slug, isPublished: true },
      relations: ['translations', 'lessons', 'lessons.translations'],
    });

    if (!course) {
      return null;
    }

    const translation =
      course.translations.find((t) => t.locale === locale) ||
      course.translations[0];

    return {
      id: course.id,
      slug: course.slug,
      order: course.order,
      title: translation?.title || course.slug,
      description: translation?.description || '',
      lessons: (course.lessons || []).map((lesson) => {
        const lTranslation =
          lesson.translations.find((t) => t.locale === locale) ||
          lesson.translations[0];
        return {
          id: lesson.id,
          slug: lesson.slug,
          order: lesson.order,
          title: lTranslation?.title || lesson.slug,
        };
      }),
    };
  }
}
