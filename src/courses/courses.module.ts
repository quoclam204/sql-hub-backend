import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './infrastructure/persistence/relational/entities/course.entity';
import { CourseTranslationEntity } from './infrastructure/persistence/relational/entities/course-translation.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { QuizEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz.entity';
import { QuizQuestionEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz-question.entity';
import { QuestionOptionEntity } from '../quizzes/infrastructure/persistence/relational/entities/question-option.entity';
import { QuizQuestionTranslationEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz-question-translation.entity';
import { LabEntity } from '../labs/infrastructure/persistence/relational/entities/lab.entity';
import { LabTranslationEntity } from '../labs/infrastructure/persistence/relational/entities/lab-translation.entity';
import { DatasetEntity } from '../labs/infrastructure/persistence/relational/entities/dataset.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseTranslationEntity,
      QuizEntity,
      QuizQuestionEntity,
      QuestionOptionEntity,
      QuizQuestionTranslationEntity,
      LabEntity,
      LabTranslationEntity,
      DatasetEntity,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService, TypeOrmModule],
})
export class CoursesModule {}
