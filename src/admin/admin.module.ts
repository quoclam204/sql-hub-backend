import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Lessons
import { LessonEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson-translation.entity';
import { LessonProgressEntity } from '../lessons/infrastructure/persistence/relational/entities/lesson-progress.entity';
import { CourseEntity } from '../courses/infrastructure/persistence/relational/entities/course.entity';
import { AdminLessonsController } from './lessons/admin-lessons.controller';
import { AdminLessonsService } from './lessons/admin-lessons.service';

// Quizzes
import { QuizEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz.entity';
import { QuizQuestionEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz-question.entity';
import { QuestionOptionEntity } from '../quizzes/infrastructure/persistence/relational/entities/question-option.entity';
import { QuizQuestionTranslationEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz-question-translation.entity';
import { AdminQuizQuestionsController } from './quizzes/admin-quiz-questions.controller';
import { AdminQuizQuestionsService } from './quizzes/admin-quiz-questions.service';

// Labs
import { LabEntity } from '../labs/infrastructure/persistence/relational/entities/lab.entity';
import { LabTranslationEntity } from '../labs/infrastructure/persistence/relational/entities/lab-translation.entity';
import { LabSubmissionEntity } from '../labs/infrastructure/persistence/relational/entities/lab-submission.entity';
import { DatasetEntity } from '../labs/infrastructure/persistence/relational/entities/dataset.entity';
import { AdminLabsController } from './labs/admin-labs.controller';
import { AdminLabsService } from './labs/admin-labs.service';

// Bulk Import
import { AdminBulkImportController } from './bulk-import/admin-bulk-import.controller';
import { AdminBulkImportService } from './bulk-import/admin-bulk-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonEntity,
      LessonTranslationEntity,
      LessonProgressEntity,
      CourseEntity,
      QuizEntity,
      QuizQuestionEntity,
      QuestionOptionEntity,
      QuizQuestionTranslationEntity,
      LabEntity,
      LabTranslationEntity,
      LabSubmissionEntity,
      DatasetEntity,
    ]),
  ],
  controllers: [
    AdminLessonsController,
    AdminQuizQuestionsController,
    AdminLabsController,
    AdminBulkImportController,
  ],
  providers: [
    AdminLessonsService,
    AdminQuizQuestionsService,
    AdminLabsService,
    AdminBulkImportService,
  ],
  exports: [
    AdminLessonsService,
    AdminQuizQuestionsService,
    AdminLabsService,
    AdminBulkImportService,
  ],
})
export class AdminModule {}
