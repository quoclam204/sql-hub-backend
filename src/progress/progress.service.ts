import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonProgressEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { LessonEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { QuizAttemptEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz-attempt.entity';
import { LabSubmissionEntity } from '../labs/infrastructure/persistence/relational/entities/lab-submission.entity';
import { LabEntity } from '../labs/infrastructure/persistence/relational/entities/lab.entity';
import {
  BadgeDto,
  LearnerProgressDto,
  StreakInfoDto,
} from './dto/learner-progress-response.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(LessonProgressEntity)
    private readonly lessonProgressRepo: Repository<LessonProgressEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonRepo: Repository<LessonEntity>,
    @InjectRepository(QuizAttemptEntity)
    private readonly quizAttemptRepo: Repository<QuizAttemptEntity>,
    @InjectRepository(LabSubmissionEntity)
    private readonly labSubmissionRepo: Repository<LabSubmissionEntity>,
    @InjectRepository(LabEntity)
    private readonly labRepo: Repository<LabEntity>,
  ) {}

  /**
   * Helper: Formats a Date object to YYYY-MM-DD in UTC.
   */
  private formatDateToUtc(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Helper: Returns the YYYY-MM-DD date string of the day before the given date string.
   */
  private getPreviousDateStr(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d - 1));
    return date.toISOString().split('T')[0];
  }

  /**
   * Calculates streaks (current, longest, active days, isActiveToday) from learning activity dates.
   * Deterministic, handles boundary dates and repeated activities.
   */
  calculateStreak(activityDates: Date[], referenceDate?: Date): StreakInfoDto {
    if (!activityDates || activityDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        isActiveToday: false,
        activeDates: [],
      };
    }

    // 1. Deduplicate by UTC calendar date
    const uniqueDateSet = new Set<string>();
    activityDates.forEach((d) => {
      if (d) {
        uniqueDateSet.add(this.formatDateToUtc(d));
      }
    });

    const sortedDates = Array.from(uniqueDateSet).sort();
    if (sortedDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        isActiveToday: false,
        activeDates: [],
      };
    }

    // 2. Compute Longest Streak across all historical activity
    let longestStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDateStr = sortedDates[i - 1];
      const currDateStr = sortedDates[i];

      const [y1, m1, d1] = prevDateStr.split('-').map(Number);
      const [y2, m2, d2] = currDateStr.split('-').map(Number);
      const t1 = Date.UTC(y1, m1 - 1, d1);
      const t2 = Date.UTC(y2, m2 - 1, d2);
      const diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRun++;
      } else {
        currentRun = 1;
      }
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    }

    // 3. Compute Current Streak based on reference date (default: now)
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    const todayStr = this.formatDateToUtc(ref);
    const yesterdayStr = this.getPreviousDateStr(todayStr);

    const isActiveToday = uniqueDateSet.has(todayStr);
    let currentStreak = 0;

    if (isActiveToday) {
      currentStreak = 1;
      let checkDate = this.getPreviousDateStr(todayStr);
      while (uniqueDateSet.has(checkDate)) {
        currentStreak++;
        checkDate = this.getPreviousDateStr(checkDate);
      }
    } else if (uniqueDateSet.has(yesterdayStr)) {
      // Not active today yet, but streak from yesterday is still alive
      currentStreak = 1;
      let checkDate = this.getPreviousDateStr(yesterdayStr);
      while (uniqueDateSet.has(checkDate)) {
        currentStreak++;
        checkDate = this.getPreviousDateStr(checkDate);
      }
    } else {
      // Streak broken
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak,
      totalActiveDays: sortedDates.length,
      isActiveToday,
      activeDates: sortedDates,
    };
  }

  /**
   * Calculates badges earned by learner based on progress metrics and activities.
   */
  calculateBadges(params: {
    completedLessons: LessonProgressEntity[];
    quizAttempts: QuizAttemptEntity[];
    passedSubmissions: LabSubmissionEntity[];
    longestStreak: number;
    passedLabsCount: number;
  }): BadgeDto[] {
    const {
      completedLessons,
      quizAttempts,
      passedSubmissions,
      longestStreak,
      passedLabsCount,
    } = params;

    const completedLessonsCount = completedLessons.length;
    const totalQuizAttempts = quizAttempts.length;

    // Helper: find earliest date
    const getEarliestDate = (dates: (Date | undefined)[]): string | null => {
      const valid = dates.filter((d): d is Date => !!d);
      if (valid.length === 0) return null;
      const sorted = valid.sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );
      return new Date(sorted[0]).toISOString();
    };

    // 1. First Lesson
    const isFirstLessonUnlocked = completedLessonsCount >= 1;
    const firstLessonUnlockedAt = isFirstLessonUnlocked
      ? getEarliestDate(completedLessons.map((l) => l.completedAt))
      : null;

    // 2. First Quiz
    const isFirstQuizUnlocked = totalQuizAttempts >= 1;
    const firstQuizUnlockedAt = isFirstQuizUnlocked
      ? getEarliestDate(quizAttempts.map((q) => q.createdAt))
      : null;

    // 3. First Lab
    const isFirstLabUnlocked = passedLabsCount >= 1;
    const firstLabUnlockedAt = isFirstLabUnlocked
      ? getEarliestDate(passedSubmissions.map((s) => s.createdAt))
      : null;

    // 4. Streak 3 Days
    const isStreak3Unlocked = longestStreak >= 3;

    // 5. Streak 7 Days
    const isStreak7Unlocked = longestStreak >= 7;

    // 6. Perfect Quiz Score (score = 100 or 10)
    const perfectAttempt = quizAttempts.find(
      (a) => Number(a.score) >= 100 || Number(a.score) === 10,
    );
    const isQuizMasterUnlocked = !!perfectAttempt;
    const quizMasterUnlockedAt = perfectAttempt
      ? new Date(perfectAttempt.createdAt).toISOString()
      : null;

    // 7. Lab Master (pass >= 3 distinct labs)
    const isLabMasterUnlocked = passedLabsCount >= 3;

    // 8. Scholar (complete >= 5 lessons)
    const isScholarUnlocked = completedLessonsCount >= 5;

    return [
      {
        id: 'first-lesson',
        titleVi: 'Bước khởi đầu',
        titleEn: 'First Step',
        descriptionVi: 'Hoàn thành bài học lý thuyết đầu tiên trên hệ thống',
        descriptionEn: 'Complete your first theory lesson on the platform',
        category: 'milestone',
        icon: 'book-open',
        isUnlocked: isFirstLessonUnlocked,
        unlockedAt: firstLessonUnlockedAt,
        currentProgress: Math.min(completedLessonsCount, 1),
        targetProgress: 1,
      },
      {
        id: 'first-quiz',
        titleVi: 'Thử sức trắc nghiệm',
        titleEn: 'Quiz Novice',
        descriptionVi: 'Hoàn thành bài kiểm tra trắc nghiệm đầu tiên',
        descriptionEn: 'Complete your first quiz question attempt',
        category: 'milestone',
        icon: 'help-circle',
        isUnlocked: isFirstQuizUnlocked,
        unlockedAt: firstQuizUnlockedAt,
        currentProgress: Math.min(totalQuizAttempts, 1),
        targetProgress: 1,
      },
      {
        id: 'first-lab',
        titleVi: 'Thực hành đầu tiên',
        titleEn: 'SQL Practitioner',
        descriptionVi: 'Vượt qua bài thực hành SQL đầu tiên thành công',
        descriptionEn: 'Successfully pass your first interactive SQL lab',
        category: 'milestone',
        icon: 'flask-conical',
        isUnlocked: isFirstLabUnlocked,
        unlockedAt: firstLabUnlockedAt,
        currentProgress: Math.min(passedLabsCount, 1),
        targetProgress: 1,
      },
      {
        id: 'streak-3',
        titleVi: 'Kiên trì 3 ngày',
        titleEn: '3-Day Streak',
        descriptionVi: 'Duy trì chuỗi học tập liên tục trong 3 ngày',
        descriptionEn: 'Maintain a 3-day consecutive learning streak',
        category: 'streak',
        icon: 'flame',
        isUnlocked: isStreak3Unlocked,
        unlockedAt: null,
        currentProgress: Math.min(longestStreak, 3),
        targetProgress: 3,
      },
      {
        id: 'streak-7',
        titleVi: 'Chiến binh 7 ngày',
        titleEn: '7-Day Streak',
        descriptionVi: 'Duy trì chuỗi học tập liên tục suốt 1 tuần',
        descriptionEn: 'Maintain a 7-day consecutive learning streak',
        category: 'streak',
        icon: 'zap',
        isUnlocked: isStreak7Unlocked,
        unlockedAt: null,
        currentProgress: Math.min(longestStreak, 7),
        targetProgress: 7,
      },
      {
        id: 'quiz-master',
        titleVi: 'Điểm 10 hoàn hảo',
        titleEn: 'Perfect Score',
        descriptionVi:
          'Đạt điểm số tuyệt đối trong một bài kiểm tra trắc nghiệm',
        descriptionEn: 'Achieve a perfect 100% score on any quiz attempt',
        category: 'mastery',
        icon: 'award',
        isUnlocked: isQuizMasterUnlocked,
        unlockedAt: quizMasterUnlockedAt,
        currentProgress: isQuizMasterUnlocked ? 1 : 0,
        targetProgress: 1,
      },
      {
        id: 'lab-master',
        titleVi: 'Chuyên gia SQL',
        titleEn: 'SQL Master',
        descriptionVi: 'Vượt qua ít nhất 3 bài thực hành SQL khác nhau',
        descriptionEn: 'Successfully pass at least 3 distinct SQL labs',
        category: 'mastery',
        icon: 'trophy',
        isUnlocked: isLabMasterUnlocked,
        unlockedAt: null,
        currentProgress: Math.min(passedLabsCount, 3),
        targetProgress: 3,
      },
      {
        id: 'scholar',
        titleVi: 'Học giả chăm chỉ',
        titleEn: 'Avid Scholar',
        descriptionVi: 'Hoàn thành ít nhất 5 bài học lý thuyết',
        descriptionEn: 'Complete at least 5 theory lessons',
        category: 'mastery',
        icon: 'star',
        isUnlocked: isScholarUnlocked,
        unlockedAt: null,
        currentProgress: Math.min(completedLessonsCount, 5),
        targetProgress: 5,
      },
    ];
  }

  /**
   * Returns comprehensive learner progress, streaks, and badges (FR-PROG-01 & FR-PROG-02).
   */
  async getLearnerProgress(
    userId: number,
    referenceDate?: Date,
  ): Promise<LearnerProgressDto> {
    const numericUserId = Number(userId);

    // 1. Fetch all user learning records in parallel
    const [
      completedLessons,
      totalLessonsCount,
      quizAttempts,
      passedSubmissions,
      allSubmissions,
      totalLabsCount,
    ] = await Promise.all([
      this.lessonProgressRepo.find({
        where: { userId: numericUserId },
        select: ['id', 'lessonId', 'completedAt'],
      }),
      this.lessonRepo.count(),
      this.quizAttemptRepo.find({
        where: { userId: numericUserId },
        select: ['id', 'quizId', 'score', 'createdAt'],
      }),
      this.labSubmissionRepo.find({
        where: { userId: numericUserId, passed: true },
        select: ['id', 'labId', 'createdAt'],
      }),
      this.labSubmissionRepo.find({
        where: { userId: numericUserId },
        select: ['id', 'createdAt'],
      }),
      this.labRepo.count(),
    ]);

    // 2. Quiz statistics calculation
    const totalAttempts = quizAttempts.length;
    let averageScore = 0;
    let highestScore = 0;
    const uniqueQuizzes = new Set<number>();

    if (totalAttempts > 0) {
      const totalScoreSum = quizAttempts.reduce(
        (sum, attempt) => sum + (Number(attempt.score) || 0),
        0,
      );
      averageScore = Math.round((totalScoreSum / totalAttempts) * 10) / 10;
      highestScore = Math.max(
        ...quizAttempts.map((attempt) => Number(attempt.score) || 0),
      );
      quizAttempts.forEach((attempt) => {
        if (attempt.quizId) {
          uniqueQuizzes.add(Number(attempt.quizId));
        }
      });
    }

    // 3. Unique passed labs
    const uniquePassedLabs = new Set<number>();
    passedSubmissions.forEach((sub) => {
      if (sub.labId) {
        uniquePassedLabs.add(Number(sub.labId));
      }
    });

    // 4. Collect all activity timestamps for streak calculation
    const activityDates: Date[] = [];
    completedLessons.forEach((l) => {
      if (l.completedAt) activityDates.push(l.completedAt);
    });
    quizAttempts.forEach((q) => {
      if (q.createdAt) activityDates.push(q.createdAt);
    });
    allSubmissions.forEach((s) => {
      if (s.createdAt) activityDates.push(s.createdAt);
    });

    // 5. Calculate Streaks & Badges (FR-PROG-02)
    const streak = this.calculateStreak(activityDates, referenceDate);
    const badges = this.calculateBadges({
      completedLessons,
      quizAttempts,
      passedSubmissions,
      longestStreak: streak.longestStreak,
      passedLabsCount: uniquePassedLabs.size,
    });

    return {
      completedLessonsCount: completedLessons.length,
      totalLessonsCount,
      quizStats: {
        totalAttempts,
        averageScore,
        highestScore,
        completedQuizzesCount: uniqueQuizzes.size,
      },
      passedLabsCount: uniquePassedLabs.size,
      totalLabsCount,
      streak,
      badges,
    };
  }

  /**
   * Dedicated method for streak retrieval.
   */
  async getLearnerStreak(
    userId: number,
    referenceDate?: Date,
  ): Promise<StreakInfoDto> {
    const progress = await this.getLearnerProgress(userId, referenceDate);
    return progress.streak;
  }

  /**
   * Dedicated method for badges retrieval.
   */
  async getLearnerBadges(
    userId: number,
    referenceDate?: Date,
  ): Promise<BadgeDto[]> {
    const progress = await this.getLearnerProgress(userId, referenceDate);
    return progress.badges;
  }
}
