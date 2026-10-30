import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminStatisticsService } from './admin-statistics.service';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import { LessonProgressEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { LessonEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { QuizAttemptEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-attempt.entity';
import { LabEntity } from '../../labs/infrastructure/persistence/relational/entities/lab.entity';
import { LabSubmissionEntity } from '../../labs/infrastructure/persistence/relational/entities/lab-submission.entity';

describe('AdminStatisticsService', () => {
  let service: AdminStatisticsService;
  let userRepo: jest.Mocked<Partial<Repository<UserEntity>>>;
  let lessonProgressRepo: jest.Mocked<Partial<Repository<LessonProgressEntity>>>;
  let lessonRepo: jest.Mocked<Partial<Repository<LessonEntity>>>;
  let quizAttemptRepo: jest.Mocked<Partial<Repository<QuizAttemptEntity>>>;
  let labRepo: jest.Mocked<Partial<Repository<LabEntity>>>;
  let labSubmissionRepo: jest.Mocked<Partial<Repository<LabSubmissionEntity>>>;

  beforeEach(async () => {
    userRepo = {
      count: jest.fn(),
    };
    lessonProgressRepo = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    lessonRepo = {
      count: jest.fn(),
    };
    quizAttemptRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    labRepo = {
      count: jest.fn(),
      find: jest.fn(),
    };
    labSubmissionRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminStatisticsService,
        { provide: getRepositoryToken(UserEntity), useValue: userRepo },
        {
          provide: getRepositoryToken(LessonProgressEntity),
          useValue: lessonProgressRepo,
        },
        { provide: getRepositoryToken(LessonEntity), useValue: lessonRepo },
        {
          provide: getRepositoryToken(QuizAttemptEntity),
          useValue: quizAttemptRepo,
        },
        { provide: getRepositoryToken(LabEntity), useValue: labRepo },
        {
          provide: getRepositoryToken(LabSubmissionEntity),
          useValue: labSubmissionRepo,
        },
      ],
    }).compile();

    service = module.get<AdminStatisticsService>(AdminStatisticsService);
  });

  describe('getStatistics', () => {
    it('should correctly calculate metrics for populated database with distinct deduplication', async () => {
      // 1. Total learners
      (userRepo.count as jest.Mock).mockResolvedValue(10);

      // 2. Active learners query builder mocks
      const mockQb = (userIds: number[]) => ({
        select: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue(userIds.map((id) => ({ userId: id }))),
      });

      (lessonProgressRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb([1, 2]),
      );
      (quizAttemptRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb([2, 3]),
      );
      (labSubmissionRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb([3, 4]),
      );

      // 3. Lessons count
      (lessonRepo.count as jest.Mock).mockResolvedValue(15);
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(45);

      // 4. Quizzes
      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([
        { score: 8 },
        { score: 9 },
        { score: 10 },
      ]);

      // 5. Labs & Submissions
      (labRepo.count as jest.Mock).mockResolvedValue(2);
      (labSubmissionRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, userId: 1, labId: 101, passed: true, runtimeMs: 50 },
        { id: 2, userId: 1, labId: 101, passed: false, runtimeMs: 70 },
        { id: 3, userId: 2, labId: 101, passed: true, runtimeMs: 60 },
        { id: 4, userId: 3, labId: 102, passed: false, runtimeMs: 120 },
      ]);

      (labRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 101,
          translations: [
            { locale: 'vi', title: 'Truy vấn cơ bản' },
            { locale: 'en', title: 'Basic Queries' },
          ],
        },
        {
          id: 102,
          translations: [
            { locale: 'vi', title: 'Nâng cao' },
            { locale: 'en', title: 'Advanced Queries' },
          ],
        },
      ]);

      const result = await service.getStatistics();

      // Assertions
      expect(result.overview.totalLearners).toBe(10);
      // Active users set should have [1, 2, 3, 4] -> size 4
      expect(result.overview.activeLearners).toBe(4);
      expect(result.overview.totalLessons).toBe(15);
      expect(result.overview.completedLessonsCount).toBe(45);

      // Quiz average: (8 + 9 + 10) / 3 = 9.0
      expect(result.overview.totalQuizAttempts).toBe(3);
      expect(result.overview.averageQuizScore).toBe(9.0);

      // Submissions: 4 total, 2 passed -> 50.0%
      expect(result.overview.totalLabs).toBe(2);
      expect(result.overview.totalSubmissions).toBe(4);
      expect(result.overview.passedSubmissions).toBe(2);
      expect(result.overview.labPassRate).toBe(50.0);

      // Learner pass rate:
      // attempted: 1, 2, 3 (3 learners)
      // passed: 1, 2 (2 learners)
      // 2 / 3 = 66.7%
      expect(result.overview.learnerLabPassRate).toBe(66.7);

      // Labs statistics breakdown
      expect(result.labsStatistics).toHaveLength(2);

      // Lab 101: 3 submissions, 2 passed -> passRate = 66.7%, avgRuntime = (50+70+60)/3 = 60
      expect(result.labsStatistics[0]).toEqual({
        labId: 101,
        titleVi: 'Truy vấn cơ bản',
        titleEn: 'Basic Queries',
        totalSubmissions: 3,
        passedSubmissions: 2,
        passRate: 66.7,
        averageRuntimeMs: 60,
      });

      // Lab 102: 1 submission, 0 passed -> passRate = 0%, avgRuntime = 120
      expect(result.labsStatistics[1]).toEqual({
        labId: 102,
        titleVi: 'Nâng cao',
        titleEn: 'Advanced Queries',
        totalSubmissions: 1,
        passedSubmissions: 0,
        passRate: 0,
        averageRuntimeMs: 120,
      });
    });

    it('should handle completely empty database without division by zero or NaN', async () => {
      (userRepo.count as jest.Mock).mockResolvedValue(0);

      const mockEmptyQb = () => ({
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      (lessonProgressRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockEmptyQb(),
      );
      (quizAttemptRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockEmptyQb(),
      );
      (labSubmissionRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockEmptyQb(),
      );

      (lessonRepo.count as jest.Mock).mockResolvedValue(0);
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(0);
      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([]);
      (labRepo.count as jest.Mock).mockResolvedValue(0);
      (labSubmissionRepo.find as jest.Mock).mockResolvedValue([]);
      (labRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getStatistics();

      expect(result.overview).toEqual({
        totalLearners: 0,
        activeLearners: 0,
        totalLessons: 0,
        completedLessonsCount: 0,
        totalLabs: 0,
        totalSubmissions: 0,
        passedSubmissions: 0,
        labPassRate: 0,
        learnerLabPassRate: 0,
        totalQuizAttempts: 0,
        averageQuizScore: 0,
      });
      expect(result.labsStatistics).toEqual([]);
    });

    it('should correctly calculate pass rate when all submissions fail', async () => {
      (userRepo.count as jest.Mock).mockResolvedValue(5);

      const mockQb = (userIds: number[]) => ({
        select: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue(userIds.map((id) => ({ userId: id }))),
      });

      (lessonProgressRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb([]),
      );
      (quizAttemptRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb([]),
      );
      (labSubmissionRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb([1]),
      );

      (lessonRepo.count as jest.Mock).mockResolvedValue(1);
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(0);
      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([]);
      (labRepo.count as jest.Mock).mockResolvedValue(1);
      (labSubmissionRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, userId: 1, labId: 10, passed: false, runtimeMs: 15 },
        { id: 2, userId: 1, labId: 10, passed: false, runtimeMs: 25 },
      ]);
      (labRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 10,
          translations: [],
        },
      ]);

      const result = await service.getStatistics();

      expect(result.overview.totalSubmissions).toBe(2);
      expect(result.overview.passedSubmissions).toBe(0);
      expect(result.overview.labPassRate).toBe(0);
      expect(result.overview.learnerLabPassRate).toBe(0);

      expect(result.labsStatistics[0].titleVi).toBe('Lab #10');
      expect(result.labsStatistics[0].titleEn).toBe('Lab #10');
      expect(result.labsStatistics[0].passRate).toBe(0);
    });

    it('should prevent repeated submissions from a single learner from skewing learnerLabPassRate', async () => {
      (userRepo.count as jest.Mock).mockResolvedValue(2);

      const mockQb = () => ({
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      (lessonProgressRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb(),
      );
      (quizAttemptRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb(),
      );
      (labSubmissionRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb(),
      );

      (lessonRepo.count as jest.Mock).mockResolvedValue(1);
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(0);
      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([]);
      (labRepo.count as jest.Mock).mockResolvedValue(1);

      // User 1 submitted and passed 10 times
      // User 2 submitted and failed 10 times
      const submissions = [
        ...Array.from({ length: 10 }).map((_, i) => ({
          id: i + 1,
          userId: 1,
          labId: 1,
          passed: true,
          runtimeMs: 40,
        })),
        ...Array.from({ length: 10 }).map((_, i) => ({
          id: i + 11,
          userId: 2,
          labId: 1,
          passed: false,
          runtimeMs: 45,
        })),
      ];

      (labSubmissionRepo.find as jest.Mock).mockResolvedValue(submissions);
      (labRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 1,
          translations: [
            { locale: 'vi', title: 'Lab Thử Nghiệm' },
            { locale: 'en', title: 'Test Lab' },
          ],
        },
      ]);

      const result = await service.getStatistics();

      // Total submissions: 20, passed: 10 -> 50%
      expect(result.overview.totalSubmissions).toBe(20);
      expect(result.overview.passedSubmissions).toBe(10);
      expect(result.overview.labPassRate).toBe(50.0);

      // Learner level: 2 learners attempted, 1 passed -> exactly 50% (not 10 out of 2)
      expect(result.overview.learnerLabPassRate).toBe(50.0);
    });
  });
});
