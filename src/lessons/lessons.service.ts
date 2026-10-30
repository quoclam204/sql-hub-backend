import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CourseEntity } from '../courses/infrastructure/persistence/relational/entities/course.entity';
import { LessonEntity } from './infrastructure/persistence/relational/entities/lesson.entity';
import { LessonProgressEntity } from './infrastructure/persistence/relational/entities/lesson-progress.entity';
import {
  CourseListItemDto,
  CourseDetailDto,
  LessonDetailDto,
  ProgressItemDto,
  LessonSearchResultDto,
} from './dto/lesson-response.dto';

function extractSnippet(
  content: string,
  query: string,
  maxLength: number = 160,
): string {
  if (!content) return '';
  // Strip YAML frontmatter if present and markdown markers
  const stripped = content
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/[#*`>]/g, ' ')
    .trim();
  const lowerContent = stripped.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerContent.indexOf(lowerQuery);

  if (idx === -1) {
    return (
      stripped.slice(0, maxLength).trim() +
      (stripped.length > maxLength ? '...' : '')
    );
  }

  const start = Math.max(0, idx - 40);
  const end = Math.min(stripped.length, idx + query.length + 80);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < stripped.length ? '...' : '';
  return (
    prefix +
    stripped.slice(start, end).replace(/\s+/g, ' ').trim() +
    suffix
  );
}

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,

    @InjectRepository(LessonEntity)
    private readonly lessonRepository: Repository<LessonEntity>,

    @InjectRepository(LessonProgressEntity)
    private readonly progressRepository: Repository<LessonProgressEntity>,
  ) {}

  // ── GET /courses ──────────────────────────────────────────────────────────

  async findAllCourses(
    locale: string,
    userId?: number,
  ): Promise<CourseListItemDto[]> {
    const courses = await this.courseRepository.find({
      where: { isPublished: true },
      order: { order: 'ASC' },
      relations: ['translations', 'lessons'],
    });

    // Fetch completed lesson ids for the user (all courses at once)
    let completedLessonIds: number[] = [];
    if (userId) {
      const lessonIds = courses.flatMap(
        (c) => c.lessons?.map((l) => l.id) ?? [],
      );
      if (lessonIds.length) {
        const progresses = await this.progressRepository.find({
          where: { userId, lessonId: In(lessonIds) },
          select: ['lessonId'],
        });
        completedLessonIds = progresses.map((p) => p.lessonId);
      }
    }

    return courses.map((course) => {
      const translation =
        course.translations.find((t) => t.locale === locale) ??
        course.translations[0];

      const lessonIds = course.lessons?.map((l) => l.id) ?? [];
      const completedCount = completedLessonIds.filter((id) =>
        lessonIds.includes(id),
      ).length;

      return {
        id: course.id,
        slug: course.slug,
        order: course.order,
        title: translation?.title ?? course.slug,
        description: translation?.description ?? '',
        lessonsCount: lessonIds.length,
        completedCount,
      };
    });
  }

  // ── GET /courses/:slug ────────────────────────────────────────────────────

  async findCourseBySlug(
    slug: string,
    locale: string,
    userId?: number,
  ): Promise<CourseDetailDto> {
    const course = await this.courseRepository.findOne({
      where: { slug, isPublished: true },
      order: { lessons: { order: 'ASC' } },
      relations: ['translations', 'lessons', 'lessons.translations'],
    });

    if (!course) {
      throw new NotFoundException(`Course '${slug}' not found`);
    }

    const translation =
      course.translations.find((t) => t.locale === locale) ??
      course.translations[0];

    const sortedLessons = (course.lessons ?? []).sort(
      (a, b) => a.order - b.order,
    );

    // Fetch completed lesson ids for the authenticated user
    let completedLessonIdSet = new Set<number>();
    if (userId && sortedLessons.length > 0) {
      const lessonIds = sortedLessons.map((l) => l.id);
      const progresses = await this.progressRepository.find({
        where: { userId, lessonId: In(lessonIds) },
        select: ['lessonId'],
      });
      completedLessonIdSet = new Set(progresses.map((p) => p.lessonId));
    }

    return {
      id: course.id,
      slug: course.slug,
      order: course.order,
      title: translation?.title ?? course.slug,
      description: translation?.description ?? '',
      lessons: sortedLessons.map((lesson) => {
        const lt =
          lesson.translations.find((t) => t.locale === locale) ??
          lesson.translations[0];
        return {
          id: lesson.id,
          slug: lesson.slug,
          order: lesson.order,
          title: lt?.title ?? lesson.slug,
          isPreview: lesson.isPreview,
          completed: completedLessonIdSet.has(lesson.id),
        };
      }),
    };
  }

  // ── GET /lessons/:slug ────────────────────────────────────────────────────

  async findLessonBySlug(
    slug: string,
    locale: string,
    userId?: number,
  ): Promise<LessonDetailDto> {
    const lesson = await this.lessonRepository.findOne({
      where: { slug },
      relations: ['translations', 'course'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson '${slug}' not found`);
    }

    // Guest can only access preview lessons
    if (!userId && !lesson.isPreview) {
      throw new ForbiddenException(
        'Authentication required to access this lesson',
      );
    }

    // Fetch siblings ordered by order within the same course
    const siblings = await this.lessonRepository.find({
      where: { courseId: lesson.courseId },
      order: { order: 'ASC' },
      select: ['id', 'slug', 'order'],
    });

    const idx = siblings.findIndex((s) => s.id === lesson.id);
    const prevSlug = idx > 0 ? siblings[idx - 1].slug : null;
    const nextSlug = idx < siblings.length - 1 ? siblings[idx + 1].slug : null;

    // Resolve translation with fallback
    let translation = lesson.translations.find((t) => t.locale === locale);
    const translated = !!translation;
    if (!translation) {
      translation = lesson.translations[0];
    }

    return {
      id: lesson.id,
      slug: lesson.slug,
      order: lesson.order,
      title: translation?.title ?? lesson.slug,
      contentMd: translation?.contentMd ?? '',
      isPreview: lesson.isPreview,
      translated,
      prevSlug,
      nextSlug,
    };
  }

  // ── POST /lessons/:id/complete ────────────────────────────────────────────

  async completeLesson(lessonId: number, userId: number): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      select: ['id'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson #${lessonId} not found`);
    }

    // Idempotent: only insert if not already completed
    const existing = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });

    if (!existing) {
      await this.progressRepository.save(
        this.progressRepository.create({ userId, lessonId }),
      );
    }
  }

  // ── GET /progress ─────────────────────────────────────────────────────────

  async getProgress(userId: number): Promise<ProgressItemDto[]> {
    const progresses = await this.progressRepository.find({
      where: { userId },
      relations: ['lesson'],
      order: { completedAt: 'ASC' },
    });

    return progresses.map((p) => ({
      lessonId: p.lessonId,
      lessonSlug: p.lesson.slug,
      completedAt: p.completedAt,
    }));
  }

  // ── GET /lessons/search ───────────────────────────────────────────────────

  async searchLessons(
    query: string,
    locale: string,
    userId?: number,
  ): Promise<LessonSearchResultDto[]> {
    if (!query || !query.trim()) {
      return [];
    }

    // Escape %, _ and \ for ILIKE pattern matching
    const escaped = query.trim().replace(/[%_\\]/g, '\\$&');
    const qPattern = `%${escaped}%`;

    const lessons = await this.lessonRepository
      .createQueryBuilder('lesson')
      .innerJoinAndSelect(
        'lesson.course',
        'course',
        'course.isPublished = true',
      )
      .leftJoinAndSelect('course.translations', 'courseTranslation')
      .leftJoinAndSelect('lesson.translations', 'lessonTranslation')
      .where(
        '(lessonTranslation.title ILIKE :q ESCAPE \'\\\' OR lessonTranslation.contentMd ILIKE :q ESCAPE \'\\\' OR lesson.slug ILIKE :q ESCAPE \'\\\')',
        { q: qPattern },
      )
      .orderBy('course.order', 'ASC')
      .addOrderBy('lesson.order', 'ASC')
      .getMany();

    return lessons.map((lesson) => {
      const lt =
        lesson.translations.find((t) => t.locale === locale) ??
        lesson.translations[0];
      const ct =
        lesson.course?.translations?.find((t) => t.locale === locale) ??
        lesson.course?.translations?.[0];

      // For guests: snippets only from is_preview lessons; non-preview gets null
      const canSeeSnippet = !!userId || lesson.isPreview;
      const snippet = canSeeSnippet
        ? extractSnippet(lt?.contentMd ?? '', query.trim())
        : null;

      return {
        id: lesson.id,
        slug: lesson.slug,
        order: lesson.order,
        title: lt?.title ?? lesson.slug,
        snippet,
        courseSlug: lesson.course?.slug ?? '',
        courseTitle: ct?.title ?? lesson.course?.slug ?? '',
        isPreview: lesson.isPreview,
      };
    });
  }
}
