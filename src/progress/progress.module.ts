import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { LessonProgressEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { LessonEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { QuizAttemptEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz-attempt.entity';
import { LabSubmissionEntity } from '../labs/infrastructure/persistence/relational/entities/lab-submission.entity';
import { LabEntity } from '../labs/infrastructure/persistence/relational/entities/lab.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonProgressEntity,
      LessonEntity,
      QuizAttemptEntity,
      LabSubmissionEntity,
      LabEntity,
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
