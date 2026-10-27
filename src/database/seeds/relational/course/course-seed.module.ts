import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { CourseTranslationEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course-translation.entity';
import { CourseSeedService } from './course-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity, CourseTranslationEntity])],
  providers: [CourseSeedService],
  exports: [CourseSeedService],
})
export class CourseSeedModule {}
