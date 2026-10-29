import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizEntity } from './infrastructure/persistence/relational/entities/quiz.entity';
import { QuizQuestionEntity } from './infrastructure/persistence/relational/entities/quiz-question.entity';
import { QuestionOptionEntity } from './infrastructure/persistence/relational/entities/question-option.entity';
import { QuizAttemptEntity } from './infrastructure/persistence/relational/entities/quiz-attempt.entity';
import { QuizQuestionTranslationEntity } from './infrastructure/persistence/relational/entities/quiz-question-translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizEntity,
      QuizQuestionEntity,
      QuestionOptionEntity,
      QuizAttemptEntity,
      QuizQuestionTranslationEntity,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class QuizzesModule {}
