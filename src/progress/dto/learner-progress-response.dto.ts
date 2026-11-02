import { ApiProperty } from '@nestjs/swagger';

export class QuizStatsDto {
  @ApiProperty({
    example: 5,
    description: 'Total number of quiz attempts made by learner',
  })
  totalAttempts: number;

  @ApiProperty({
    example: 85.5,
    description: 'Average score across all quiz attempts',
  })
  averageScore: number;

  @ApiProperty({
    example: 100,
    description: 'Highest score achieved by learner',
  })
  highestScore: number;

  @ApiProperty({
    example: 3,
    description: 'Number of distinct quizzes completed',
  })
  completedQuizzesCount: number;
}

export class StreakInfoDto {
  @ApiProperty({
    example: 3,
    description: 'Current consecutive active days streak',
  })
  currentStreak: number;

  @ApiProperty({
    example: 7,
    description: 'Longest consecutive active days streak ever achieved',
  })
  longestStreak: number;

  @ApiProperty({
    example: 12,
    description: 'Total distinct active calendar days',
  })
  totalActiveDays: number;

  @ApiProperty({
    example: true,
    description:
      'Whether the learner has completed any learning activity today',
  })
  isActiveToday: boolean;

  @ApiProperty({
    example: ['2026-10-27', '2026-10-28', '2026-10-29'],
    description:
      'List of unique active calendar dates (YYYY-MM-DD) sorted ascending',
  })
  activeDates: string[];
}

export class BadgeDto {
  @ApiProperty({
    example: 'first-lesson',
    description: 'Unique badge identifier',
  })
  id: string;

  @ApiProperty({
    example: 'Bước khởi đầu',
    description: 'Badge title in Vietnamese',
  })
  titleVi: string;

  @ApiProperty({ example: 'First Step', description: 'Badge title in English' })
  titleEn: string;

  @ApiProperty({
    example: 'Hoàn thành bài học lý thuyết đầu tiên',
    description: 'Badge description in Vietnamese',
  })
  descriptionVi: string;

  @ApiProperty({
    example: 'Complete your first lesson',
    description: 'Badge description in English',
  })
  descriptionEn: string;

  @ApiProperty({
    example: 'milestone',
    enum: ['milestone', 'streak', 'mastery'],
    description: 'Badge category',
  })
  category: 'milestone' | 'streak' | 'mastery';

  @ApiProperty({ example: 'book-open', description: 'Badge icon identifier' })
  icon: string;

  @ApiProperty({ example: true, description: 'Whether the badge is unlocked' })
  isUnlocked: boolean;

  @ApiProperty({
    example: '2026-10-25T08:30:00.000Z',
    nullable: true,
    description: 'Timestamp when the badge was unlocked',
  })
  unlockedAt: string | null;

  @ApiProperty({
    example: 1,
    description: 'Current progress towards this badge',
  })
  currentProgress: number;

  @ApiProperty({
    example: 1,
    description: 'Target progress needed to unlock badge',
  })
  targetProgress: number;
}

export class LearnerProgressDto {
  @ApiProperty({
    example: 12,
    description: 'Number of lessons completed by learner',
  })
  completedLessonsCount: number;

  @ApiProperty({
    example: 30,
    description: 'Total number of available lessons',
  })
  totalLessonsCount: number;

  @ApiProperty({
    type: () => QuizStatsDto,
    description: 'Quiz performance statistics',
  })
  quizStats: QuizStatsDto;

  @ApiProperty({
    example: 4,
    description: 'Number of unique labs passed by learner',
  })
  passedLabsCount: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of available labs',
  })
  totalLabsCount: number;

  @ApiProperty({
    type: () => StreakInfoDto,
    description: 'Streak statistics and active learning days (FR-PROG-02)',
  })
  streak: StreakInfoDto;

  @ApiProperty({
    type: () => [BadgeDto],
    description: 'Gamification badges awarded to learner (FR-PROG-02)',
  })
  badges: BadgeDto[];
}
