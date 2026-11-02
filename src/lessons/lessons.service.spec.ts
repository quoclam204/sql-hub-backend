import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CourseEntity } from '../courses/infrastructure/persistence/relational/entities/course.entity';
import { LessonEntity } from './infrastructure/persistence/relational/entities/lesson.entity';
import { LessonProgressEntity } from './infrastructure/persistence/relational/entities/lesson-progress.entity';

type MockRepo<T = unknown> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockCourseRepo = (): MockRepo<CourseEntity> => ({
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockLessonRepo = (): MockRepo<LessonEntity> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockProgressRepo = (): MockRepo<LessonProgressEntity> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn((x) => x),
});

describe('LessonsService', () => {
  let service: LessonsService;
  let courseRepo: MockRepo<CourseEntity>;
  let lessonRepo: MockRepo<LessonEntity>;
  let progressRepo: MockRepo<LessonProgressEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: getRepositoryToken(CourseEntity),
          useFactory: mockCourseRepo,
        },
        {
          provide: getRepositoryToken(LessonEntity),
          useFactory: mockLessonRepo,
        },
        {
          provide: getRepositoryToken(LessonProgressEntity),
          useFactory: mockProgressRepo,
        },
      ],
    }).compile();

    service = module.get(LessonsService);
    courseRepo = module.get(getRepositoryToken(CourseEntity));
    lessonRepo = module.get(getRepositoryToken(LessonEntity));
    progressRepo = module.get(getRepositoryToken(LessonProgressEntity));
  });

  // ── findAllCourses ─────────────────────────────────────────────────────────

  describe('findAllCourses', () => {
    const baseCourse = {
      id: 1,
      slug: 'sql-co-ban',
      order: 1,
      isPublished: true,
      translations: [{ locale: 'vi', title: 'SQL Cơ Bản', description: 'Mô tả' }],
      lessons: [{ id: 10 }, { id: 11 }],
    } as unknown as CourseEntity;

    it('returns mapped courses with completedCount=0 for guest', async () => {
      courseRepo.find!.mockResolvedValue([baseCourse]);

      const result = await service.findAllCourses('vi', undefined);

      expect(result).toHaveLength(1);
      expect(result[0].completedCount).toBe(0);
      expect(result[0].lessonsCount).toBe(2);
      expect(result[0].slug).toBe('sql-co-ban');
    });

    it('counts completed lessons per course for authenticated user', async () => {
      courseRepo.find!.mockResolvedValue([baseCourse]);
      progressRepo.find!.mockResolvedValue([{ lessonId: 10 }]);

      const result = await service.findAllCourses('vi', 42);

      expect(result[0].completedCount).toBe(1);
    });

    it('falls back to first translation when locale not found', async () => {
      const course = {
        ...baseCourse,
        translations: [{ locale: 'en', title: 'SQL Basics', description: '' }],
      } as unknown as CourseEntity;
      courseRepo.find!.mockResolvedValue([course]);

      const result = await service.findAllCourses('vi', undefined);
      expect(result[0].title).toBe('SQL Basics');
    });
  });

  // ── findCourseBySlug ───────────────────────────────────────────────────────

  describe('findCourseBySlug', () => {
    it('throws NotFoundException for unknown slug', async () => {
      courseRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.findCourseBySlug('unknown', 'vi'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns course detail with lessons sorted by order', async () => {
      courseRepo.findOne!.mockResolvedValue({
        id: 1,
        slug: 'sql-co-ban',
        order: 1,
        translations: [{ locale: 'vi', title: 'SQL Cơ Bản', description: 'Mô tả' }],
        lessons: [
          {
            id: 2,
            slug: 'bai-2',
            order: 2,
            isPreview: false,
            translations: [{ locale: 'vi', title: 'Bài 2' }],
          },
          {
            id: 1,
            slug: 'bai-1',
            order: 1,
            isPreview: true,
            translations: [{ locale: 'vi', title: 'Bài 1' }],
          },
        ],
      });

      const result = await service.findCourseBySlug('sql-co-ban', 'vi');
      expect(result.lessons[0].order).toBe(1);
      expect(result.lessons[1].order).toBe(2);
      expect(result.lessons[0].isPreview).toBe(true);
      expect(result.lessons[0].completed).toBe(false);
      expect(result.lessons[1].completed).toBe(false);
    });

    it('marks completed=true for lessons completed by authenticated user', async () => {
      courseRepo.findOne!.mockResolvedValue({
        id: 1,
        slug: 'sql-co-ban',
        order: 1,
        translations: [{ locale: 'vi', title: 'SQL Cơ Bản', description: 'Mô tả' }],
        lessons: [
          {
            id: 1,
            slug: 'bai-1',
            order: 1,
            isPreview: true,
            translations: [{ locale: 'vi', title: 'Bài 1' }],
          },
        ],
      });
      progressRepo.find!.mockResolvedValue([{ lessonId: 1 }]);

      const result = await service.findCourseBySlug('sql-co-ban', 'vi', 42);
      expect(result.lessons[0].completed).toBe(true);
    });
  });

  // ── findLessonBySlug ───────────────────────────────────────────────────────

  describe('findLessonBySlug', () => {
    const baseLesson = {
      id: 1,
      slug: 'select-co-ban',
      order: 1,
      courseId: 1,
      isPreview: false,
      translations: [
        { locale: 'vi', title: 'SELECT Cơ Bản', contentMd: '# Content' },
      ],
    } as unknown as LessonEntity;

    const siblings = [
      { id: 1, slug: 'select-co-ban', order: 1 },
      { id: 2, slug: 'where-clause', order: 2 },
    ] as LessonEntity[];

    it('throws NotFoundException for unknown slug', async () => {
      lessonRepo.findOne!.mockResolvedValue(null);

      await expect(
        service.findLessonBySlug('unknown', 'vi', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for non-preview lesson without auth', async () => {
      lessonRepo.findOne!.mockResolvedValue(baseLesson);

      await expect(
        service.findLessonBySlug('select-co-ban', 'vi', undefined),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows guest to read a preview lesson', async () => {
      const previewLesson = { ...baseLesson, isPreview: true };
      lessonRepo.findOne!.mockResolvedValue(previewLesson);
      lessonRepo.find!.mockResolvedValue([siblings[0]]);

      const result = await service.findLessonBySlug(
        'select-co-ban',
        'vi',
        undefined,
      );
      expect(result.slug).toBe('select-co-ban');
    });

    it('returns detail with prev/next slugs', async () => {
      lessonRepo.findOne!.mockResolvedValue(baseLesson);
      lessonRepo.find!.mockResolvedValue(siblings);

      const result = await service.findLessonBySlug(
        'select-co-ban',
        'vi',
        42,
      );
      expect(result.prevSlug).toBeNull();
      expect(result.nextSlug).toBe('where-clause');
    });

    it('sets translated=false and falls back when locale is missing', async () => {
      lessonRepo.findOne!.mockResolvedValue({
        ...baseLesson,
        translations: [{ locale: 'en', title: 'Basic SELECT', contentMd: '# EN' }],
      });
      lessonRepo.find!.mockResolvedValue([siblings[0]]);

      const result = await service.findLessonBySlug('select-co-ban', 'vi', 42);
      expect(result.translated).toBe(false);
      expect(result.title).toBe('Basic SELECT');
    });
  });

  // ── completeLesson ─────────────────────────────────────────────────────────

  describe('completeLesson', () => {
    it('throws NotFoundException for unknown lesson id', async () => {
      lessonRepo.findOne!.mockResolvedValue(null);

      await expect(service.completeLesson(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('inserts progress row on first completion', async () => {
      lessonRepo.findOne!.mockResolvedValue({ id: 1 });
      progressRepo.findOne!.mockResolvedValue(null);
      progressRepo.save!.mockResolvedValue({});

      await service.completeLesson(1, 42);

      expect(progressRepo.save).toHaveBeenCalledTimes(1);
    });

    it('is idempotent — does NOT insert on second call', async () => {
      lessonRepo.findOne!.mockResolvedValue({ id: 1 });
      progressRepo.findOne!.mockResolvedValue({ id: 99 }); // already exists

      await service.completeLesson(1, 42);

      expect(progressRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── getProgress ────────────────────────────────────────────────────────────

  describe('getProgress', () => {
    it('returns empty array when no progress', async () => {
      progressRepo.find!.mockResolvedValue([]);

      const result = await service.getProgress(42);
      expect(result).toEqual([]);
    });

    it('returns progress items with lessonSlug', async () => {
      progressRepo.find!.mockResolvedValue([
        {
          lessonId: 1,
          lesson: { slug: 'select-co-ban' },
          completedAt: new Date('2024-01-01'),
        },
      ]);

      const result = await service.getProgress(42);
      expect(result[0].lessonSlug).toBe('select-co-ban');
    });
  });

  // ── searchLessons ──────────────────────────────────────────────────────────

  describe('searchLessons', () => {
    it('returns empty array when query is empty', async () => {
      const result = await service.searchLessons('', 'vi');
      expect(result).toEqual([]);
    });

    it('queries and maps search results with course info', async () => {
      const qb: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            slug: 'select-co-ban',
            order: 1,
            isPreview: true,
            course: {
              slug: 'sql-co-ban',
              translations: [{ locale: 'vi', title: 'SQL Cơ Bản' }],
            },
            translations: [{ locale: 'vi', title: 'SELECT Cơ Bản' }],
          },
        ]),
      };
      lessonRepo.createQueryBuilder!.mockReturnValue(qb);

      const results = await service.searchLessons('SELECT', 'vi');

      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe('select-co-ban');
      expect(results[0].courseSlug).toBe('sql-co-ban');
      expect(results[0].courseTitle).toBe('SQL Cơ Bản');
      expect(results[0].isPreview).toBe(true);
    });

    it('returns snippet for preview lesson when user is guest', async () => {
      const qb: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            slug: 'select-co-ban',
            order: 1,
            isPreview: true,
            course: { slug: 'sql-co-ban', translations: [{ locale: 'vi', title: 'SQL Cơ Bản' }] },
            translations: [{ locale: 'vi', title: 'SELECT', contentMd: '# SELECT cơ bản\nCú pháp câu lệnh' }],
          },
        ]),
      };
      lessonRepo.createQueryBuilder!.mockReturnValue(qb);

      const results = await service.searchLessons('SELECT', 'vi', undefined);
      expect(results[0].snippet).not.toBeNull();
      expect(results[0].snippet).toContain('SELECT');
    });

    it('omits snippet (returns null) for non-preview lesson when user is guest', async () => {
      const qb: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 2,
            slug: 'where-clause',
            order: 2,
            isPreview: false,
            course: { slug: 'sql-co-ban', translations: [{ locale: 'vi', title: 'SQL Cơ Bản' }] },
            translations: [{ locale: 'vi', title: 'WHERE', contentMd: '# WHERE clause secret' }],
          },
        ]),
      };
      lessonRepo.createQueryBuilder!.mockReturnValue(qb);

      const results = await service.searchLessons('secret', 'vi', undefined);
      expect(results[0].snippet).toBeNull();
    });

    it('returns snippet for non-preview lesson when user is authenticated', async () => {
      const qb: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 2,
            slug: 'where-clause',
            order: 2,
            isPreview: false,
            course: { slug: 'sql-co-ban', translations: [{ locale: 'vi', title: 'SQL Cơ Bản' }] },
            translations: [{ locale: 'vi', title: 'WHERE', contentMd: '# WHERE clause secret content' }],
          },
        ]),
      };
      lessonRepo.createQueryBuilder!.mockReturnValue(qb);

      const results = await service.searchLessons('secret', 'vi', 42);
      expect(results[0].snippet).not.toBeNull();
      expect(results[0].snippet).toContain('secret');
    });

    it('escapes %, _ and backslash in query pattern', async () => {
      let whereSql = '';
      let whereParams: any = {};
      const qb: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation((sql, params) => {
          whereSql = sql;
          whereParams = params;
          return qb;
        }),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      lessonRepo.createQueryBuilder!.mockReturnValue(qb);

      await service.searchLessons('100%_test\\', 'vi');
      expect(whereSql).toContain("ESCAPE '\\'");
      expect(whereParams.q).toBe('%100\\%\\_test\\\\%');
    });
  });
});
