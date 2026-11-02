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
  let lessonProgressRepo: jest.Mocked<
    Partial<Repository<LessonProgressEntity>>
  >;
  let lessonRepo: jest.Mocked<Partial<Repository<LessonEntity>>>;
  let quizAttemptRepo: jest.Mocked<Partial<Repository<QuizAttemptEntity>>>;
  let labSubmissionRepo: jest.Mocked<Partial<Repository<LabSubmissionEntity>>>;
  let labRepo: jest.Mocked<Partial<Repository<LabEntity>>>;

  beforeEach(async () => {
    lessonProgressRepo = {
      find: jest.fn(),
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

  describe('calculateStreak (FR-PROG-02)', () => {
    it('should return zeros for empty activity data', () => {
      const result = service.calculateStreak([]);
      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        isActiveToday: false,
        activeDates: [],
      });
    });

    it('should calculate consecutive streak when active today', () => {
      const refDate = new Date('2026-10-29T12:00:00Z');
      const dates = [
        new Date('2026-10-26T10:00:00Z'),
        new Date('2026-10-27T14:30:00Z'),
        new Date('2026-10-28T09:15:00Z'),
        new Date('2026-10-29T08:00:00Z'), // Today
      ];

      const result = service.calculateStreak(dates, refDate);
      expect(result.currentStreak).toBe(4);
      expect(result.longestStreak).toBe(4);
      expect(result.totalActiveDays).toBe(4);
      expect(result.isActiveToday).toBe(true);
      expect(result.activeDates).toEqual([
        '2026-10-26',
        '2026-10-27',
        '2026-10-28',
        '2026-10-29',
      ]);
    });

    it('should maintain streak when active yesterday but not yet active today', () => {
      const refDate = new Date('2026-10-29T12:00:00Z');
      const dates = [
        new Date('2026-10-27T10:00:00Z'),
        new Date('2026-10-28T14:30:00Z'), // Yesterday
      ];

      const result = service.calculateStreak(dates, refDate);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
      expect(result.totalActiveDays).toBe(2);
      expect(result.isActiveToday).toBe(false);
    });

    it('should reset current streak to 0 when inactive for 2 or more days, but preserve longest streak', () => {
      const refDate = new Date('2026-10-29T12:00:00Z');
      // Last active date was Oct 25 (4 days ago)
      const dates = [
        new Date('2026-10-21T10:00:00Z'),
        new Date('2026-10-22T10:00:00Z'),
        new Date('2026-10-23T10:00:00Z'),
        new Date('2026-10-24T10:00:00Z'),
        new Date('2026-10-25T10:00:00Z'),
      ];

      const result = service.calculateStreak(dates, refDate);
      expect(result.currentStreak).toBe(0); // Streak broken
      expect(result.longestStreak).toBe(5); // Preserves 5-day streak
      expect(result.totalActiveDays).toBe(5);
      expect(result.isActiveToday).toBe(false);
    });

    it('should deduplicate multiple activities on the same calendar day', () => {
      const refDate = new Date('2026-10-29T12:00:00Z');
      const dates = [
        new Date('2026-10-28T09:00:00Z'),
        new Date('2026-10-28T10:00:00Z'),
        new Date('2026-10-28T15:30:00Z'),
        new Date('2026-10-29T08:00:00Z'),
        new Date('2026-10-29T11:00:00Z'),
        new Date('2026-10-29T20:00:00Z'),
      ];

      const result = service.calculateStreak(dates, refDate);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
      expect(result.totalActiveDays).toBe(2);
      expect(result.isActiveToday).toBe(true);
    });

    it('should handle month boundary transitions accurately', () => {
      const refDate = new Date('2026-11-02T12:00:00Z');
      const dates = [
        new Date('2026-10-30T10:00:00Z'),
        new Date('2026-10-31T15:00:00Z'),
        new Date('2026-11-01T08:00:00Z'),
        new Date('2026-11-02T10:00:00Z'), // Today
      ];

      const result = service.calculateStreak(dates, refDate);
      expect(result.currentStreak).toBe(4);
      expect(result.longestStreak).toBe(4);
      expect(result.totalActiveDays).toBe(4);
      expect(result.isActiveToday).toBe(true);
    });

    it('should handle leap year transitions accurately (Feb 28 -> Feb 29 -> Mar 01)', () => {
      const refDate = new Date('2024-03-01T12:00:00Z');
      const dates = [
        new Date('2024-02-28T10:00:00Z'),
        new Date('2024-02-29T15:00:00Z'), // Leap day
        new Date('2024-03-01T08:00:00Z'), // Today
      ];

      const result = service.calculateStreak(dates, refDate);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.totalActiveDays).toBe(3);
    });
  });

  describe('calculateBadges (FR-PROG-02)', () => {
    it('should return all badges locked for learner with no progress', () => {
      const badges = service.calculateBadges({
        completedLessons: [],
        quizAttempts: [],
        passedSubmissions: [],
        longestStreak: 0,
        passedLabsCount: 0,
      });

      expect(badges).toHaveLength(8);
      expect(badges.every((b) => !b.isUnlocked)).toBe(true);
      expect(badges.every((b) => b.unlockedAt === null)).toBe(true);
    });

    it('should unlock first-step milestone badges when first activity occurs', () => {
      const lessonDate = new Date('2026-10-20T10:00:00Z');
      const quizDate = new Date('2026-10-21T11:00:00Z');
      const labDate = new Date('2026-10-22T12:00:00Z');

      const badges = service.calculateBadges({
        completedLessons: [
          {
            id: 1,
            lessonId: 10,
            userId: 1,
            completedAt: lessonDate,
          } as LessonProgressEntity,
        ],
        quizAttempts: [
          {
            id: 1,
            quizId: 20,
            userId: 1,
            score: 80,
            createdAt: quizDate,
          } as QuizAttemptEntity,
        ],
        passedSubmissions: [
          {
            id: 1,
            labId: 30,
            userId: 1,
            passed: true,
            createdAt: labDate,
          } as LabSubmissionEntity,
        ],
        longestStreak: 1,
        passedLabsCount: 1,
      });

      const firstLesson = badges.find((b) => b.id === 'first-lesson');
      const firstQuiz = badges.find((b) => b.id === 'first-quiz');
      const firstLab = badges.find((b) => b.id === 'first-lab');

      expect(firstLesson?.isUnlocked).toBe(true);
      expect(firstLesson?.unlockedAt).toBe(lessonDate.toISOString());

      expect(firstQuiz?.isUnlocked).toBe(true);
      expect(firstQuiz?.unlockedAt).toBe(quizDate.toISOString());

      expect(firstLab?.isUnlocked).toBe(true);
      expect(firstLab?.unlockedAt).toBe(labDate.toISOString());
    });

    it('should unlock streak badges when streak threshold is achieved', () => {
      const badges = service.calculateBadges({
        completedLessons: [],
        quizAttempts: [],
        passedSubmissions: [],
        longestStreak: 7,
        passedLabsCount: 0,
      });

      const streak3 = badges.find((b) => b.id === 'streak-3');
      const streak7 = badges.find((b) => b.id === 'streak-7');

      expect(streak3?.isUnlocked).toBe(true);
      expect(streak7?.isUnlocked).toBe(true);
    });

    it('should unlock mastery badges (quiz-master, lab-master, scholar)', () => {
      const perfectQuizDate = new Date('2026-10-25T14:00:00Z');

      const badges = service.calculateBadges({
        completedLessons: Array.from({ length: 5 }).map((_, i) => ({
          id: i + 1,
          lessonId: i + 1,
          userId: 1,
          completedAt: new Date(),
        })) as LessonProgressEntity[],
        quizAttempts: [
          {
            id: 1,
            quizId: 1,
            userId: 1,
            score: 100, // Perfect score
            createdAt: perfectQuizDate,
          } as QuizAttemptEntity,
        ],
        passedSubmissions: Array.from({ length: 3 }).map((_, i) => ({
          id: i + 1,
          labId: i + 1,
          userId: 1,
          passed: true,
          createdAt: new Date(),
        })) as LabSubmissionEntity[],
        longestStreak: 2,
        passedLabsCount: 3,
      });

      const quizMaster = badges.find((b) => b.id === 'quiz-master');
      const labMaster = badges.find((b) => b.id === 'lab-master');
      const scholar = badges.find((b) => b.id === 'scholar');

      expect(quizMaster?.isUnlocked).toBe(true);
      expect(quizMaster?.unlockedAt).toBe(perfectQuizDate.toISOString());
      expect(labMaster?.isUnlocked).toBe(true);
      expect(scholar?.isUnlocked).toBe(true);
    });
  });

  describe('getLearnerProgress integration', () => {
    it('should return complete progress summary with streak and badges for new user', async () => {
      (lessonProgressRepo.find as jest.Mock).mockResolvedValue([]);
      (lessonRepo.count as jest.Mock).mockResolvedValue(20);
      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([]);
      (labSubmissionRepo.find as jest.Mock).mockResolvedValue([]);
      (labRepo.count as jest.Mock).mockResolvedValue(10);

      const result = await service.getLearnerProgress(1);

      expect(result.completedLessonsCount).toBe(0);
      expect(result.totalLessonsCount).toBe(20);
      expect(result.passedLabsCount).toBe(0);
      expect(result.totalLabsCount).toBe(10);

      // Streaks
      expect(result.streak).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        isActiveToday: false,
        activeDates: [],
      });

      // Badges
      expect(result.badges).toHaveLength(8);
      expect(result.badges.every((b) => !b.isUnlocked)).toBe(true);
    });

    it('should return complete progress summary with streak and badges for active user', async () => {
      const refDate = new Date('2026-10-29T12:00:00Z');

      (lessonProgressRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, lessonId: 1, completedAt: new Date('2026-10-28T10:00:00Z') },
        { id: 2, lessonId: 2, completedAt: new Date('2026-10-29T11:00:00Z') },
      ]);
      (lessonRepo.count as jest.Mock).mockResolvedValue(15);

      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 1,
          quizId: 10,
          score: 100,
          createdAt: new Date('2026-10-29T14:00:00Z'),
        },
      ]);

      (labSubmissionRepo.find as jest.Mock)
        .mockResolvedValueOnce([
          // passedSubmissions
          {
            id: 1,
            labId: 100,
            passed: true,
            createdAt: new Date('2026-10-28T15:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([
          // allSubmissions
          { id: 1, createdAt: new Date('2026-10-28T15:00:00Z') },
        ]);

      (labRepo.count as jest.Mock).mockResolvedValue(8);

      const result = await service.getLearnerProgress(2, refDate);

      expect(result.completedLessonsCount).toBe(2);
      expect(result.totalLessonsCount).toBe(15);
      expect(result.passedLabsCount).toBe(1);

      // Streak: active on Oct 28 and Oct 29 (refDate is Oct 29) => 2 days
      expect(result.streak.currentStreak).toBe(2);
      expect(result.streak.longestStreak).toBe(2);
      expect(result.streak.isActiveToday).toBe(true);

      // Unlocked badges: first-lesson, first-quiz, first-lab, quiz-master
      const unlockedIds = result.badges
        .filter((b) => b.isUnlocked)
        .map((b) => b.id);
      expect(unlockedIds).toContain('first-lesson');
      expect(unlockedIds).toContain('first-quiz');
      expect(unlockedIds).toContain('first-lab');
      expect(unlockedIds).toContain('quiz-master');
    });

    it('should count quiz attempts and distinct passed labs according to dashboard definitions', async () => {
      (lessonProgressRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, lessonId: 1, completedAt: new Date('2026-10-29T10:00:00Z') },
      ]);
      (lessonRepo.count as jest.Mock).mockResolvedValue(3);
      (quizAttemptRepo.find as jest.Mock).mockResolvedValue([
        {
          id: 1,
          quizId: 10,
          score: 60,
          createdAt: new Date('2026-10-29T11:00:00Z'),
        },
        {
          id: 2,
          quizId: 10,
          score: 80,
          createdAt: new Date('2026-10-29T12:00:00Z'),
        },
        {
          id: 3,
          quizId: 20,
          score: 100,
          createdAt: new Date('2026-10-29T13:00:00Z'),
        },
      ]);
      (labSubmissionRepo.find as jest.Mock)
        .mockResolvedValueOnce([
          {
            id: 1,
            labId: 100,
            passed: true,
            createdAt: new Date('2026-10-29T14:00:00Z'),
          },
          {
            id: 2,
            labId: 100,
            passed: true,
            createdAt: new Date('2026-10-29T15:00:00Z'),
          },
          {
            id: 3,
            labId: 200,
            passed: true,
            createdAt: new Date('2026-10-29T16:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([]);
      (labRepo.count as jest.Mock).mockResolvedValue(4);

      const result = await service.getLearnerProgress(
        3,
        new Date('2026-10-29T23:00:00Z'),
      );

      expect(result.completedLessonsCount).toBe(1);
      expect(result.totalLessonsCount).toBe(3);
      expect(result.quizStats).toEqual({
        totalAttempts: 3,
        averageScore: 80,
        highestScore: 100,
        completedQuizzesCount: 2,
      });
      expect(result.passedLabsCount).toBe(2);
      expect(result.totalLabsCount).toBe(4);
    });
  });
});
