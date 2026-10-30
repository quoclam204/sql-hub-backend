import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from './infrastructure/persistence/relational/entities/course.entity';
import { QuizEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz.entity';
import { LabEntity } from '../labs/infrastructure/persistence/relational/entities/lab.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
    @InjectRepository(QuizEntity)
    private readonly quizRepository: Repository<QuizEntity>,
    @InjectRepository(LabEntity)
    private readonly labRepository: Repository<LabEntity>,
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

  async findLesson(
    courseSlug: string,
    lessonSlug: string,
    locale: string = 'vi',
  ) {
    const course = await this.courseRepository.findOne({
      where: { slug: courseSlug, isPublished: true },
      relations: ['lessons', 'lessons.translations'],
    });
    const lesson = course?.lessons?.find((item) => item.slug === lessonSlug);

    if (!lesson) {
      return null;
    }
    if (!course) {
      return null;
    }

    const translation =
      lesson.translations.find((item) => item.locale === locale) ||
      lesson.translations.find((item) => item.locale === 'en') ||
      lesson.translations[0];

    const [quizzes, labs] = await Promise.all([
      this.quizRepository.find({
        where: { lessonId: lesson.id },
        relations: ['questions', 'questions.options', 'questions.translations'],
        order: { id: 'ASC' },
      }),
      this.labRepository.find({
        where: { lessonId: lesson.id },
        relations: ['dataset', 'translations'],
        order: { id: 'ASC' },
      }),
    ]);

    return {
      course: {
        slug: courseSlug,
        title:
          course.translations.find((item) => item.locale === locale)?.title ||
          course.translations.find((item) => item.locale === 'en')?.title ||
          courseSlug,
      },
      lesson: {
        id: lesson.id,
        slug: lesson.slug,
        order: lesson.order,
        title: translation?.title || lesson.slug,
        contentMd: translation?.contentMd || '',
      },
      quizzes: quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        questions: (quiz.questions || [])
          .sort((a, b) => a.order - b.order)
          .map((question) => {
            const questionTranslation =
              question.translations.find((item) => item.locale === locale) ||
              question.translations.find((item) => item.locale === 'en') ||
              question.translations[0];
            return {
              id: question.id,
              order: question.order,
              questionText:
                questionTranslation?.questionText || question.questionText,
              explanation:
                questionTranslation?.explanation || question.explanation || '',
              options: (question.options || [])
                .sort((a, b) => a.order - b.order)
                .map((option) => ({
                  id: option.id,
                  order: option.order,
                  optionText:
                    locale === 'en'
                      ? option.optionTextEn || option.optionText
                      : option.optionText,
                })),
            };
          }),
      })),
      labs: labs.map((lab) => {
        const labTranslation =
          lab.translations.find((item) => item.locale === locale) ||
          lab.translations.find((item) => item.locale === 'en') ||
          lab.translations[0];
        return {
          id: lab.id,
          title: labTranslation?.title || `Lab #${lab.id}`,
          description: labTranslation?.description || '',
          hint: labTranslation?.hint || '',
          orderSensitive: lab.orderSensitive,
          dataset: lab.dataset
            ? {
                id: lab.dataset.id,
                name: lab.dataset.name,
                setupSql: lab.dataset.setupSql,
              }
            : null,
        };
      }),
    };
  }
}
