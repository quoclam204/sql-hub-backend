import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { LessonEntity } from '../../../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from '../../../../lessons/infrastructure/persistence/relational/entities/lesson-translation.entity';
import { LessonSeedService } from './lesson-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      LessonEntity,
      LessonTranslationEntity,
    ]),
  ],
  providers: [LessonSeedService],
  exports: [LessonSeedService],
})
export class LessonSeedModule {}
