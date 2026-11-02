import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressService } from './progress.service';
import { LessonProgressEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { LessonEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { QuizAttemptEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz-attempt.entity';
import { LabSubmissionEntity } from '../labs/infrastructure/persistence/relational/entities/lab-submission.entity';
import { LabEntity } from '../labs/infrastructure/persistence/relational/entities/lab.entity';

describe('ProgressService', () => {
  let service: ProgressService;
  let lessonProgressRepo: jest.Mocked<Partial<Repository<LessonProgressEntity>>>;
  let lessonRepo: jest.Mocked<Partial<Repository<LessonEntity>>>;
  let quizAttemptRepo: jest.Mocked<Partial<Repository<QuizAttemptEntity>>>;
  let labSubmissionRepo: jest.Mocked<Partial<Repository<LabSubmissionEntity>>>;
  let labRepo: jest.Mocked<Partial<Repository<LabEntity>>>;

  beforeEach(async () => {
    lessonProgressRepo = {
      count: jest.fn(),
    };
    lessonRepo = {
      count: jest.fn(),
    };
    quizAttemptRepo = {
      find: jest.fn(),
    };
    labSubmissionRepo = {
      find: jest.fn(),
    };
    labRepo = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getRepositoryToken(LessonProgressEntity),
          useValue: lessonProgressRepo,
        },
        {
          provide: getRepositoryToken(LessonEntity),
          useValue: lessonRepo,
        },
        {
          provide: getRepositoryToken(QuizAttemptEntity),
          useValue: quizAttemptRepo,
        },
        {
          provide: getRepositoryToken(LabSubmissionEntity),
          useValue: labSubmissionRepo,
        },
        {
          provide: getRepositoryToken(LabEntity),
          useValue: labRepo,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLearnerProgress', () => {
    it('should return empty progress stats for a new learner with no activity', async () => {
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(0);
      (lessonRepo.count as jest.Mock).mockResolvedValue(15);
      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([]);
      (labSubmissionRepo.find as jest.Mock).mockResolvedValue([]);
      (labRepo.count as jest.Mock).mockResolvedValue(8);

      const result = await service.getLearnerProgress(1);

      expect(lessonProgressRepo.count).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(result).toEqual({
        completedLessonsCount: 0,
        totalLessonsCount: 15,
        quizStats: {
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          completedQuizzesCount: 0,
        },
        passedLabsCount: 0,
        totalLabsCount: 8,
      });
    });

    it('should correctly calculate progress for an active learner', async () => {
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(4);
      (lessonRepo.count as jest.Mock).mockResolvedValue(15);

      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, userId: 2, quizId: 101, score: 80 },
        { id: 2, userId: 2, quizId: 101, score: 100 },
        { id: 3, userId: 2, quizId: 102, score: 75 },
      ] as QuizAttemptEntity[]);

      // Passed submissions: user passed lab 10 twice and lab 11 once
      (labSubmissionRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, userId: 2, labId: 10, passed: true },
        { id: 2, userId: 2, labId: 10, passed: true },
        { id: 3, userId: 2, labId: 11, passed: true },
      ] as LabSubmissionEntity[]);

      (labRepo.count as jest.Mock).mockResolvedValue(8);

      const result = await service.getLearnerProgress(2);

      expect(result.completedLessonsCount).toBe(4);
      expect(result.totalLessonsCount).toBe(15);

      // (80 + 100 + 75) / 3 = 255 / 3 = 85
      expect(result.quizStats.totalAttempts).toBe(3);
      expect(result.quizStats.averageScore).toBe(85);
      expect(result.quizStats.highestScore).toBe(100);
      expect(result.quizStats.completedQuizzesCount).toBe(2);

      // Distinct labs: 10 and 11 => 2
      expect(result.passedLabsCount).toBe(2);
      expect(result.totalLabsCount).toBe(8);
    });

    it('should isolate queries to the specific learner userId', async () => {
      (lessonProgressRepo.count as jest.Mock).mockResolvedValue(1);
      (lessonRepo.count as jest.Mock).mockResolvedValue(10);
      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([]);
      (labSubmissionRepo.find as jest.Mock).mockResolvedValue([]);
      (labRepo.count as jest.Mock).mockResolvedValue(5);

      await service.getLearnerProgress(42);

      expect(lessonProgressRepo.count).toHaveBeenCalledWith({
        where: { userId: 42 },
      });
      expect(quizAttemptRepo.find).toHaveBeenCalledWith({
        where: { userId: 42 },
      });
      expect(labSubmissionRepo.find).toHaveBeenCalledWith({
        where: { userId: 42, passed: true },
        select: ['labId'],
      });
    });
  });
});
