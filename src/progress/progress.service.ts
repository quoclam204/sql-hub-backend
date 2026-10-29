import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonProgressEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { LessonEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { QuizAttemptEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz-attempt.entity';
import { LabSubmissionEntity } from '../labs/infrastructure/persistence/relational/entities/lab-submission.entity';
import { LabEntity } from '../labs/infrastructure/persistence/relational/entities/lab.entity';
import { LearnerProgressDto } from './dto/learner-progress-response.dto';

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

  async getLearnerProgress(userId: number): Promise<LearnerProgressDto> {
    const numericUserId = Number(userId);

    // 1. Completed lessons count and total lessons
    const [completedLessonsCount, totalLessonsCount] = await Promise.all([
      this.lessonProgressRepo.count({
        where: { userId: numericUserId },
      }),
      this.lessonRepo.count(),
    ]);

    // 2. Quiz attempts & scores for this user
    const quizAttempts = await this.quizAttemptRepo.find({
      where: { userId: numericUserId },
    });

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

    // 3. Passed labs (distinct labId passed by this user) and total labs
    const [passedSubmissions, totalLabsCount] = await Promise.all([
      this.labSubmissionRepo.find({
        where: { userId: numericUserId, passed: true },
        select: ['labId'],
      }),
      this.labRepo.count(),
    ]);

    const uniquePassedLabs = new Set<number>();
    passedSubmissions.forEach((submission) => {
      if (submission.labId) {
        uniquePassedLabs.add(Number(submission.labId));
      }
    });

    return {
      completedLessonsCount,
      totalLessonsCount,
      quizStats: {
        totalAttempts,
        averageScore,
        highestScore,
        completedQuizzesCount: uniqueQuizzes.size,
      },
      passedLabsCount: uniquePassedLabs.size,
      totalLabsCount,
    };
  }
}
