import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { AdminBulkImportService } from './admin-bulk-import.service';
import {
  BulkImportTypeEnum,
  BulkImportFormatEnum,
} from './dto/bulk-import.dto';
import { LessonEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson-translation.entity';
import { CourseEntity } from '../../courses/infrastructure/persistence/relational/entities/course.entity';
import { QuizEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz.entity';
import { QuizQuestionEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-question.entity';
import { QuestionOptionEntity } from '../../quizzes/infrastructure/persistence/relational/entities/question-option.entity';
import { QuizQuestionTranslationEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-question-translation.entity';
import { LabEntity } from '../../labs/infrastructure/persistence/relational/entities/lab.entity';
import { LabTranslationEntity } from '../../labs/infrastructure/persistence/relational/entities/lab-translation.entity';
import { DatasetEntity } from '../../labs/infrastructure/persistence/relational/entities/dataset.entity';

describe('AdminBulkImportService', () => {
  let service: AdminBulkImportService;

  const mockTransactionManager = {
    create: jest.fn((entityClass, data) => ({ ...data, id: 99 })),
    save: jest.fn(async (entityClass, data) => data),
  };

  const mockDataSource = {
    transaction: jest.fn(async (cb) => cb(mockTransactionManager)),
  };

  const mockLessonRepo = {
    find: jest.fn(),
    create: jest.fn((dto) => ({ ...dto, id: 1 })),
    save: jest.fn(async (dto) => dto),
  };

  const mockCourseRepo = {
    find: jest.fn(),
  };

  const mockQuizRepo = {
    find: jest.fn(),
  };

  const mockQuestionRepo = {
    find: jest.fn(),
  };

  const mockOptionRepo = {
    find: jest.fn(),
  };

  const mockDatasetRepo = {
    find: jest.fn(),
  };

  const mockLessonTranslationRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn(async (dto) => dto),
  };

  const mockQuestionTranslationRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn(async (dto) => dto),
  };

  const mockLabRepo = {
    find: jest.fn(),
    create: jest.fn((dto) => ({ ...dto, id: 1 })),
    save: jest.fn(async (dto) => dto),
  };

  const mockLabTranslationRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn(async (dto) => dto),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBulkImportService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(LessonEntity), useValue: mockLessonRepo },
        {
          provide: getRepositoryToken(LessonTranslationEntity),
          useValue: mockLessonTranslationRepo,
        },
        { provide: getRepositoryToken(CourseEntity), useValue: mockCourseRepo },
        { provide: getRepositoryToken(QuizEntity), useValue: mockQuizRepo },
        {
          provide: getRepositoryToken(QuizQuestionEntity),
          useValue: mockQuestionRepo,
        },
        {
          provide: getRepositoryToken(QuestionOptionEntity),
          useValue: mockOptionRepo,
        },
        {
          provide: getRepositoryToken(QuizQuestionTranslationEntity),
          useValue: mockQuestionTranslationRepo,
        },
        { provide: getRepositoryToken(LabEntity), useValue: mockLabRepo },
        {
          provide: getRepositoryToken(LabTranslationEntity),
          useValue: mockLabTranslationRepo,
        },
        { provide: getRepositoryToken(DatasetEntity), useValue: mockDatasetRepo },
      ],
    }).compile();

    service = module.get<AdminBulkImportService>(AdminBulkImportService);
  });

  describe('Lessons Bulk Import', () => {
    it('should validate and preview lessons in dryRun mode without database writes', async () => {
      mockCourseRepo.find.mockResolvedValueOnce([{ id: 1, slug: 'sql-basics' }]);
      mockLessonRepo.find.mockResolvedValueOnce([]); // no existing slugs

      const content = JSON.stringify([
        {
          courseId: 1,
          slug: 'lesson-1',
          order: 1,
          titleVi: 'Bài học 1',
          titleEn: 'Lesson 1',
          contentVi: '# Nội dung',
          contentEn: '# Content',
        },
      ]);

      const result = await service.execute({
        type: BulkImportTypeEnum.LESSONS,
        format: BulkImportFormatEnum.JSON,
        content,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.totalCount).toBe(1);
      expect(result.importedCount).toBe(0);
      expect(result.preview?.length).toBe(1);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should persist lessons transactionally when dryRun is false', async () => {
      mockCourseRepo.find.mockResolvedValueOnce([{ id: 1, slug: 'sql-basics' }]);
      mockLessonRepo.find.mockResolvedValueOnce([]);

      const content = JSON.stringify([
        {
          courseId: 1,
          slug: 'lesson-trans',
          order: 1,
          titleVi: 'Bài 1',
          titleEn: 'Lesson 1',
        },
      ]);

      const result = await service.execute({
        type: BulkImportTypeEnum.LESSONS,
        format: BulkImportFormatEnum.JSON,
        content,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockTransactionManager.create).toHaveBeenCalledWith(
        LessonEntity,
        expect.objectContaining({ slug: 'lesson-trans' }),
      );
    });

    it('should reject duplicate slugs within the same import batch', async () => {
      mockCourseRepo.find.mockResolvedValueOnce([{ id: 1, slug: 'sql-basics' }]);
      mockLessonRepo.find.mockResolvedValueOnce([]);

      const content = JSON.stringify([
        { courseId: 1, slug: 'duplicate-slug', titleVi: 'Bài 1' },
        { courseId: 1, slug: 'duplicate-slug', titleVi: 'Bài 2' },
      ]);

      await expect(
        service.execute({
          type: BulkImportTypeEnum.LESSONS,
          format: BulkImportFormatEnum.JSON,
          content,
          dryRun: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when referenced course does not exist', async () => {
      mockCourseRepo.find.mockResolvedValueOnce([{ id: 1, slug: 'sql-basics' }]);
      mockLessonRepo.find.mockResolvedValueOnce([]);

      const content = JSON.stringify([
        { courseId: 999, slug: 'valid-slug', titleVi: 'Bài 1' },
      ]);

      await expect(
        service.execute({
          type: BulkImportTypeEnum.LESSONS,
          format: BulkImportFormatEnum.JSON,
          content,
          dryRun: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should parse lessons from Markdown format with frontmatter', async () => {
      mockCourseRepo.find.mockResolvedValueOnce([{ id: 1, slug: 'sql-basics' }]);
      mockLessonRepo.find.mockResolvedValueOnce([]);

      const mdContent = `---
courseId: 1
slug: md-lesson
order: 1
titleVi: Bài học Markdown
titleEn: Markdown Lesson
---
# vi
# Nội dung tiếng Việt
# en
# English Content`;

      const result = await service.execute({
        type: BulkImportTypeEnum.LESSONS,
        format: BulkImportFormatEnum.MARKDOWN,
        content: mdContent,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.totalCount).toBe(1);
      expect(result.preview?.[0].slug).toBe('md-lesson');
      expect(result.preview?.[0].contentVi).toContain('Nội dung tiếng Việt');
      expect(result.preview?.[0].contentEn).toContain('English Content');
    });
  });

  describe('Quiz Questions Bulk Import', () => {
    it('should validate and persist quiz questions with options', async () => {
      mockQuizRepo.find.mockResolvedValueOnce([{ id: 1 }]);

      const content = JSON.stringify([
        {
          quizId: 1,
          order: 1,
          questionTextVi: 'Câu lệnh nào dùng để truy vấn?',
          questionTextEn: 'Which statement is used to query?',
          explanationVi: 'SELECT là câu lệnh cơ bản.',
          explanationEn: 'SELECT is the basic statement.',
          options: [
            { optionTextVi: 'SELECT', isCorrect: true },
            { optionTextVi: 'DROP', isCorrect: false },
          ],
        },
      ]);

      const result = await service.execute({
        type: BulkImportTypeEnum.QUIZ_QUESTIONS,
        format: BulkImportFormatEnum.JSON,
        content,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(mockTransactionManager.create).toHaveBeenCalledWith(
        QuizQuestionEntity,
        expect.objectContaining({ quizId: 1 }),
      );
      expect(mockTransactionManager.create).toHaveBeenCalledWith(
        QuestionOptionEntity,
        expect.objectContaining({ optionText: 'SELECT', isCorrect: true }),
      );
    });

    it('should reject quiz questions with fewer than 2 options', async () => {
      mockQuizRepo.find.mockResolvedValueOnce([{ id: 1 }]);

      const content = JSON.stringify([
        {
          quizId: 1,
          questionTextVi: 'Câu hỏi thiếu đáp án',
          questionTextEn: 'Incomplete question',
          options: [{ optionTextVi: 'Duy nhất', isCorrect: true }],
        },
      ]);

      await expect(
        service.execute({
          type: BulkImportTypeEnum.QUIZ_QUESTIONS,
          format: BulkImportFormatEnum.JSON,
          content,
          dryRun: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject quiz questions with 0 or multiple correct options', async () => {
      mockQuizRepo.find.mockResolvedValueOnce([{ id: 1 }]);

      const content = JSON.stringify([
        {
          quizId: 1,
          questionTextVi: 'Câu hỏi sai logic đáp án',
          questionTextEn: 'Invalid correct options logic',
          options: [
            { optionTextVi: 'A', isCorrect: true },
            { optionTextVi: 'B', isCorrect: true },
          ],
        },
      ]);

      await expect(
        service.execute({
          type: BulkImportTypeEnum.QUIZ_QUESTIONS,
          format: BulkImportFormatEnum.JSON,
          content,
          dryRun: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Labs Bulk Import', () => {
    it('should validate and persist labs with read query', async () => {
      mockDatasetRepo.find.mockResolvedValueOnce([{ id: 1, name: 'hr_db' }]);
      mockLessonRepo.find.mockResolvedValueOnce([]);

      const content = JSON.stringify([
        {
          datasetId: 1,
          expectedQuery: 'SELECT * FROM employees WHERE salary > 1000;',
          orderSensitive: false,
          titleVi: 'Lab 1',
          titleEn: 'Lab 1',
        },
      ]);

      const result = await service.execute({
        type: BulkImportTypeEnum.LABS,
        format: BulkImportFormatEnum.JSON,
        content,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(mockTransactionManager.create).toHaveBeenCalledWith(
        LabEntity,
        expect.objectContaining({ datasetId: 1 }),
      );
    });

    it('should reject labs with non-read query (safety guard)', async () => {
      mockDatasetRepo.find.mockResolvedValueOnce([{ id: 1, name: 'hr_db' }]);
      mockLessonRepo.find.mockResolvedValueOnce([]);

      const content = JSON.stringify([
        {
          datasetId: 1,
          expectedQuery: 'DELETE FROM employees WHERE salary > 1000;',
          titleVi: 'Unsafe lab',
          titleEn: 'Unsafe lab',
        },
      ]);

      await expect(
        service.execute({
          type: BulkImportTypeEnum.LABS,
          format: BulkImportFormatEnum.JSON,
          content,
          dryRun: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
