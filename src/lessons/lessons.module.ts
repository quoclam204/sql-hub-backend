import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonEntity } from './infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from './infrastructure/persistence/relational/entities/lesson-translation.entity';
import { LessonProgressEntity } from './infrastructure/persistence/relational/entities/lesson-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonEntity,
      LessonTranslationEntity,
      LessonProgressEntity,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class LessonsModule {}
