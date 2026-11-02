import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminLessonsService } from './admin-lessons.service';
import { LessonEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson-translation.entity';
import { LessonProgressEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { CourseEntity } from '../../courses/infrastructure/persistence/relational/entities/course.entity';

describe('AdminLessonsService', () => {
  let service: AdminLessonsService;
  let lessonRepo: jest.Mocked<Partial<Repository<LessonEntity>>>;
  let lessonTranslationRepo: jest.Mocked<Partial<Repository<LessonTranslationEntity>>>;
  let lessonProgressRepo: jest.Mocked<Partial<Repository<LessonProgressEntity>>>;
  let courseRepo: jest.Mocked<Partial<Repository<CourseEntity>>>;

  beforeEach(async () => {
    lessonRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    lessonTranslationRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    lessonProgressRepo = {
      count: jest.fn(),
    };
    courseRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLessonsService,
        { provide: getRepositoryToken(LessonEntity), useValue: lessonRepo },
        { provide: getRepositoryToken(LessonTranslationEntity), useValue: lessonTranslationRepo },
        { provide: getRepositoryToken(LessonProgressEntity), useValue: lessonProgressRepo },
        { provide: getRepositoryToken(CourseEntity), useValue: courseRepo },
      ],
    }).compile();

    service = module.get<AdminLessonsService>(AdminLessonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if course does not exist', async () => {
      (courseRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create({
          courseId: 999,
          slug: 'test-lesson',
          titleVi: 'Bài 1',
          contentVi: 'Nội dung',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if slug already exists', async () => {
      (courseRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as CourseEntity);
      (lessonRepo.findOne as jest.Mock).mockResolvedValue({ id: 2, slug: 'test-lesson' } as LessonEntity);

      await expect(
        service.create({
          courseId: 1,
          slug: 'test-lesson',
          titleVi: 'Bài 1',
          contentVi: 'Nội dung',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create a lesson with bilingual content', async () => {
      (courseRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as CourseEntity);
      (lessonRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // uniqueness check
        .mockResolvedValueOnce({
          id: 10,
          courseId: 1,
          slug: 'intro-sql',
          order: 1,
          translations: [
            { id: 1, locale: 'vi', title: 'Bài 1: Giới thiệu SQL', contentMd: '# Nội dung' },
            { id: 2, locale: 'en', title: 'Lesson 1: Intro SQL', contentMd: '# Content' },
          ],
        } as unknown as LessonEntity); // findOne result

      (lessonRepo.create as jest.Mock).mockReturnValue({ id: 10, courseId: 1, slug: 'intro-sql', order: 1 });
      (lessonRepo.save as jest.Mock).mockResolvedValue({ id: 10, courseId: 1, slug: 'intro-sql', order: 1 });
      (lessonTranslationRepo.create as jest.Mock).mockImplementation((dto) => dto);
      (lessonTranslationRepo.save as jest.Mock).mockResolvedValue([]);

      const result = await service.create({
        courseId: 1,
        slug: 'intro-sql',
        order: 1,
        titleVi: 'Bài 1: Giới thiệu SQL',
        contentVi: '# Nội dung',
        titleEn: 'Lesson 1: Intro SQL',
        contentEn: '# Content',
      });

      expect(result.id).toBe(10);
      expect(result.titleVi).toBe('Bài 1: Giới thiệu SQL');
      expect(result.titleEn).toBe('Lesson 1: Intro SQL');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if lesson does not exist', async () => {
      (lessonRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(404)).rejects.toThrow(NotFoundException);
    });

    it('should prevent deletion and throw BadRequestException if learners have progress', async () => {
      (lessonRepo.findOne as jest.Mock).mockResolvedValue({ id: 5 } as LessonEntity);
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(3); // 3 learners have progress

      await expect(service.delete(5)).rejects.toThrow(BadRequestException);
      expect(lessonRepo.remove).not.toHaveBeenCalled();
    });

    it('should safely delete lesson when no learners have progress', async () => {
      const mockLesson = { id: 5 } as LessonEntity;
      (lessonRepo.findOne as jest.Mock).mockResolvedValue(mockLesson);
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(0);
      (lessonRepo.remove as jest.Mock).mockResolvedValue(mockLesson);

      const result = await service.delete(5);

      expect(result.success).toBe(true);
      expect(lessonRepo.remove).toHaveBeenCalledWith(mockLesson);
    });
  });
});
