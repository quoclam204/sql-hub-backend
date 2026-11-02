import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson-translation.entity';
import { LessonProgressEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { CourseEntity } from '../../courses/infrastructure/persistence/relational/entities/course.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class AdminLessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private readonly lessonRepo: Repository<LessonEntity>,
    @InjectRepository(LessonTranslationEntity)
    private readonly lessonTranslationRepo: Repository<LessonTranslationEntity>,
    @InjectRepository(LessonProgressEntity)
    private readonly lessonProgressRepo: Repository<LessonProgressEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
  ) {}

  async findAllCourses() {
    const courses = await this.courseRepo.find({
      relations: ['translations'],
      order: { order: 'ASC' },
    });
    return courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      order: c.order,
      titleVi:
        c.translations?.find((t) => t.locale === 'vi')?.title || c.slug,
      titleEn:
        c.translations?.find((t) => t.locale === 'en')?.title || c.slug,
    }));
  }

  async findAll(courseId?: number) {
    const query = this.lessonRepo
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.course', 'course')
      .leftJoinAndSelect('lesson.translations', 'translation')
      .orderBy('lesson.order', 'ASC');

    if (courseId) {
      query.where('lesson.courseId = :courseId', { courseId });
    }

    const lessons = await query.getMany();

    return lessons.map((l) => {
      const vi = l.translations?.find((t) => t.locale === 'vi');
      const en = l.translations?.find((t) => t.locale === 'en');
      return {
        id: l.id,
        courseId: l.courseId,
        courseSlug: l.course?.slug,
        slug: l.slug,
        order: l.order,
        titleVi: vi?.title || '',
        contentVi: vi?.contentMd || '',
        titleEn: en?.title || '',
        contentEn: en?.contentMd || '',
        translations: l.translations || [],
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      };
    });
  }

  async findOne(id: number) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: Number(id) },
      relations: ['course', 'translations'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    const vi = lesson.translations?.find((t) => t.locale === 'vi');
    const en = lesson.translations?.find((t) => t.locale === 'en');

    return {
      id: lesson.id,
      courseId: lesson.courseId,
      courseSlug: lesson.course?.slug,
      slug: lesson.slug,
      order: lesson.order,
      titleVi: vi?.title || '',
      contentVi: vi?.contentMd || '',
      titleEn: en?.title || '',
      contentEn: en?.contentMd || '',
      translations: lesson.translations || [],
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }

  async create(dto: CreateLessonDto) {
    // 1. Verify course exists
    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new BadRequestException(
        `Course with ID ${dto.courseId} does not exist`,
      );
    }

    // 2. Check slug uniqueness
    const existing = await this.lessonRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(
        `Lesson with slug "${dto.slug}" already exists`,
      );
    }

    // 3. Create lesson
    const lesson = this.lessonRepo.create({
      courseId: dto.courseId,
      slug: dto.slug,
      order: dto.order ?? 1,
    });
    const savedLesson = await this.lessonRepo.save(lesson);

    // 4. Build translations (from convenience fields or translations array)
    const translationsToSave: LessonTranslationEntity[] = [];

    if (dto.titleVi || dto.contentVi) {
      translationsToSave.push(
        this.lessonTranslationRepo.create({
          lessonId: savedLesson.id,
          locale: 'vi',
          title: dto.titleVi || dto.slug,
          contentMd: dto.contentVi || '',
        }),
      );
    }

    if (dto.titleEn || dto.contentEn) {
      translationsToSave.push(
        this.lessonTranslationRepo.create({
          lessonId: savedLesson.id,
          locale: 'en',
          title: dto.titleEn || dto.slug,
          contentMd: dto.contentEn || '',
        }),
      );
    }

    if (dto.translations && dto.translations.length > 0) {
      for (const t of dto.translations) {
        if (!translationsToSave.some((item) => item.locale === t.locale)) {
          translationsToSave.push(
            this.lessonTranslationRepo.create({
              lessonId: savedLesson.id,
              locale: t.locale,
              title: t.title,
              contentMd: t.contentMd,
            }),
          );
        }
      }
    }

    if (translationsToSave.length > 0) {
      await this.lessonTranslationRepo.save(translationsToSave);
    }

    return this.findOne(savedLesson.id);
  }

  async update(id: number, dto: UpdateLessonDto) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: Number(id) },
      relations: ['translations'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Check slug uniqueness if changed
    if (dto.slug && dto.slug !== lesson.slug) {
      const existing = await this.lessonRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(
          `Lesson with slug "${dto.slug}" already exists`,
        );
      }
      lesson.slug = dto.slug;
    }

    if (dto.courseId) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new BadRequestException(
          `Course with ID ${dto.courseId} does not exist`,
        );
      }
      lesson.courseId = dto.courseId;
    }

    if (dto.order !== undefined) {
      lesson.order = dto.order;
    }

    await this.lessonRepo.save(lesson);

    // Update translations
    const updateLocale = async (
      locale: string,
      title?: string,
      content?: string,
    ) => {
      if (title === undefined && content === undefined) return;

      let trans = lesson.translations?.find((t) => t.locale === locale);
      if (trans) {
        if (title !== undefined) trans.title = title;
        if (content !== undefined) trans.contentMd = content;
        await this.lessonTranslationRepo.save(trans);
      } else {
        trans = this.lessonTranslationRepo.create({
          lessonId: lesson.id,
          locale,
          title: title || lesson.slug,
          contentMd: content || '',
        });
        await this.lessonTranslationRepo.save(trans);
      }
    };

    if (dto.titleVi !== undefined || dto.contentVi !== undefined) {
      await updateLocale('vi', dto.titleVi, dto.contentVi);
    }

    if (dto.titleEn !== undefined || dto.contentEn !== undefined) {
      await updateLocale('en', dto.titleEn, dto.contentEn);
    }

    if (dto.translations && dto.translations.length > 0) {
      for (const t of dto.translations) {
        await updateLocale(t.locale, t.title, t.contentMd);
      }
    }

    return this.findOne(lesson.id);
  }

  async delete(id: number) {
    const numericId = Number(id);
    const lesson = await this.lessonRepo.findOne({
      where: { id: numericId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Safety guard: prevent deleting lesson if learners have recorded progress
    const progressCount = await this.lessonProgressRepo.count({
      where: { lessonId: numericId },
    });

    if (progressCount > 0) {
      throw new BadRequestException(
        `Cannot delete lesson because ${progressCount} learner(s) have recorded progress on it. Archive or remove student progress before deleting.`,
      );
    }

    // Safe to delete
    await this.lessonRepo.remove(lesson);

    return { success: true, message: `Lesson ${id} successfully deleted` };
  }
}
