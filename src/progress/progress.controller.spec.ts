import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import {
  BadgeDto,
  LearnerProgressDto,
  StreakInfoDto,
} from './dto/learner-progress-response.dto';

describe('ProgressController', () => {
  let controller: ProgressController;
  let service: jest.Mocked<ProgressService>;

  beforeEach(async () => {
    const mockService = {
      getLearnerProgress: jest.fn(),
      getLearnerStreak: jest.fn(),
      getLearnerBadges: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
    service = module.get(ProgressService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getLearnerProgress to service', async () => {
    const mockProgress: LearnerProgressDto = {
      completedLessonsCount: 3,
      totalLessonsCount: 10,
      quizStats: {
        totalAttempts: 2,
        averageScore: 90,
        highestScore: 100,
        completedQuizzesCount: 1,
      },
      passedLabsCount: 2,
      totalLabsCount: 5,
      streak: {
        currentStreak: 3,
        longestStreak: 5,
        totalActiveDays: 8,
        isActiveToday: true,
        activeDates: ['2026-10-27', '2026-10-28', '2026-10-29'],
      },
      badges: [],
    };

    service.getLearnerProgress.mockResolvedValue(mockProgress);

    const result = await controller.getLearnerProgress({
      user: { id: 1, role: { id: 2 } },
    } as any);

    expect(result).toBe(mockProgress);
    expect(service.getLearnerProgress).toHaveBeenCalledWith(1);
  });

  it('should delegate getLearnerStreak to service (FR-PROG-02)', async () => {
    const mockStreak: StreakInfoDto = {
      currentStreak: 4,
      longestStreak: 7,
      totalActiveDays: 10,
      isActiveToday: true,
      activeDates: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'],
    };

    service.getLearnerStreak.mockResolvedValue(mockStreak);

    const result = await controller.getLearnerStreak({
      user: { id: 5, role: { id: 2 } },
    } as any);

    expect(result).toBe(mockStreak);
    expect(service.getLearnerStreak).toHaveBeenCalledWith(5);
  });

  it('should delegate getLearnerBadges to service (FR-PROG-02)', async () => {
    const mockBadges: BadgeDto[] = [
      {
        id: 'first-lesson',
        titleVi: 'Bước khởi đầu',
        titleEn: 'First Step',
        descriptionVi: 'Hoàn thành bài học lý thuyết đầu tiên',
        descriptionEn: 'Complete your first lesson',
        category: 'milestone',
        icon: 'book-open',
        isUnlocked: true,
        unlockedAt: '2026-10-28T09:00:00.000Z',
        currentProgress: 1,
        targetProgress: 1,
      },
    ];

    service.getLearnerBadges.mockResolvedValue(mockBadges);

    const result = await controller.getLearnerBadges({
      user: { id: 5, role: { id: 2 } },
    } as any);

    expect(result).toBe(mockBadges);
    expect(service.getLearnerBadges).toHaveBeenCalledWith(5);
  });
});
