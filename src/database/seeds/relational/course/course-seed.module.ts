import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { CourseTranslationEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course-translation.entity';
import { LessonEntity } from '../../../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from '../../../../lessons/infrastructure/persistence/relational/entities/lesson-translation.entity';
import { CourseSeedService } from './course-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseTranslationEntity,
      LessonEntity,
      LessonTranslationEntity,
    ]),
  ],
  providers: [CourseSeedService],
  exports: [CourseSeedService],
})
export class CourseSeedModule {}
