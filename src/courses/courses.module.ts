import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './infrastructure/persistence/relational/entities/course.entity';
import { CourseTranslationEntity } from './infrastructure/persistence/relational/entities/course-translation.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity, CourseTranslationEntity])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService, TypeOrmModule],
})
export class CoursesModule {}
