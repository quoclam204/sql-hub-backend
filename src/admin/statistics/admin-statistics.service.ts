import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEnum } from '../../roles/roles.enum';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import { LessonProgressEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { LessonEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { QuizAttemptEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-attempt.entity';
import { LabEntity } from '../../labs/infrastructure/persistence/relational/entities/lab.entity';
import { LabSubmissionEntity } from '../../labs/infrastructure/persistence/relational/entities/lab-submission.entity';
import {
  AdminStatisticsResponseDto,
  LabStatItemDto,
} from './dto/admin-statistics-response.dto';

@Injectable()
export class AdminStatisticsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(LessonProgressEntity)
    private readonly lessonProgressRepo: Repository<LessonProgressEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonRepo: Repository<LessonEntity>,
    @InjectRepository(QuizAttemptEntity)
    private readonly quizAttemptRepo: Repository<QuizAttemptEntity>,
    @InjectRepository(LabEntity)
    private readonly labRepo: Repository<LabEntity>,
    @InjectRepository(LabSubmissionEntity)
    private readonly labSubmissionRepo: Repository<LabSubmissionEntity>,
  ) {}

  /**
   * Calculates comprehensive admin statistics across learners, lessons, quizzes, and labs.
   * Handles empty data gracefully and avoids duplicate learner counts.
   */
  async getStatistics(): Promise<AdminStatisticsResponseDto> {
    // 1. Total Learners count (Users with role 'user')
    const totalLearners = await this.userRepo.count({
      where: { role: { id: RoleEnum.user } },
    });

    // 2. Active Learners (Distinct userIds having any activity: lesson, quiz, or lab)
    const [lessonUsers, quizUsers, labUsers] = await Promise.all([
      this.lessonProgressRepo
        .createQueryBuilder('lp')
        .select('DISTINCT lp.userId', 'userId')
        .getRawMany(),
      this.quizAttemptRepo
        .createQueryBuilder('qa')
        .select('DISTINCT qa.userId', 'userId')
        .getRawMany(),
      this.labSubmissionRepo
        .createQueryBuilder('ls')
        .select('DISTINCT ls.userId', 'userId')
        .getRawMany(),
    ]);

    const activeUserSet = new Set<number>();
    lessonUsers.forEach((r) => {
      if (r.userId) activeUserSet.add(Number(r.userId));
    });
    quizUsers.forEach((r) => {
      if (r.userId) activeUserSet.add(Number(r.userId));
    });
    labUsers.forEach((r) => {
      if (r.userId) activeUserSet.add(Number(r.userId));
    });
    const activeLearners = activeUserSet.size;

    // 3. Lessons statistics
    const [totalLessons, completedLessonsCount] = await Promise.all([
      this.lessonRepo.count(),
      this.lessonProgressRepo.count(),
    ]);

    // 4. Quizzes statistics
    const quizAttempts = await this.quizAttemptRepo.find({
      select: ['score'],
    });
    const totalQuizAttempts = quizAttempts.length;
    let averageQuizScore = 0;
    if (totalQuizAttempts > 0) {
      const scoreSum = quizAttempts.reduce(
        (sum, a) => sum + (Number(a.score) || 0),
        0,
      );
      averageQuizScore = Math.round((scoreSum / totalQuizAttempts) * 10) / 10;
    }

    // 5. Labs & Submissions statistics
    const [totalLabs, allSubmissions, allLabs] = await Promise.all([
      this.labRepo.count(),
      this.labSubmissionRepo.find({
        select: ['id', 'userId', 'labId', 'passed', 'runtimeMs'],
      }),
      this.labRepo.find({
        relations: ['translations'],
        order: { id: 'ASC' },
      }),
    ]);

    const totalSubmissions = allSubmissions.length;
    const passedSubmissions = allSubmissions.filter((s) => s.passed).length;

    // Overall submission pass rate (rounded to 1 decimal)
    const labPassRate =
      totalSubmissions > 0
        ? Math.round((passedSubmissions / totalSubmissions) * 1000) / 10
        : 0;

    // Distinct learner pass rate (learners who passed >= 1 lab / learners who attempted >= 1 lab)
    const learnersAttemptedLab = new Set<number>();
    const learnersPassedLab = new Set<number>();

    allSubmissions.forEach((s) => {
      const uId = Number(s.userId);
      if (uId) {
        learnersAttemptedLab.add(uId);
        if (s.passed) {
          learnersPassedLab.add(uId);
        }
      }
    });

    const learnerLabPassRate =
      learnersAttemptedLab.size > 0
        ? Math.round(
            (learnersPassedLab.size / learnersAttemptedLab.size) * 1000,
          ) / 10
        : 0;

    // 6. Detailed per-lab statistics
    const submissionsByLab = new Map<number, LabSubmissionEntity[]>();
    allSubmissions.forEach((s) => {
      const labId = Number(s.labId);
      const list = submissionsByLab.get(labId) || [];
      list.push(s);
      submissionsByLab.set(labId, list);
    });

    const labsStatistics: LabStatItemDto[] = allLabs.map((lab) => {
      const labSubs = submissionsByLab.get(lab.id) || [];
      const labTotal = labSubs.length;
      const labPassed = labSubs.filter((s) => s.passed).length;
      const passRate =
        labTotal > 0 ? Math.round((labPassed / labTotal) * 1000) / 10 : 0;

      const runtimeSum = labSubs.reduce(
        (sum, s) => sum + (Number(s.runtimeMs) || 0),
        0,
      );
      const averageRuntimeMs =
        labTotal > 0 ? Math.round(runtimeSum / labTotal) : 0;

      const vi = lab.translations?.find((t) => t.locale === 'vi');
      const en = lab.translations?.find((t) => t.locale === 'en');

      return {
        labId: lab.id,
        titleVi: vi?.title || `Lab #${lab.id}`,
        titleEn: en?.title || `Lab #${lab.id}`,
        totalSubmissions: labTotal,
        passedSubmissions: labPassed,
        passRate,
        averageRuntimeMs,
      };
    });

    return {
      overview: {
        totalLearners,
        activeLearners,
        totalLessons,
        completedLessonsCount,
        totalLabs,
        totalSubmissions,
        passedSubmissions,
        labPassRate,
        learnerLabPassRate,
        totalQuizAttempts,
        averageQuizScore,
      },
      labsStatistics,
    };
  }
}
