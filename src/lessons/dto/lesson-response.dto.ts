import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LessonTranslationDto {
  @ApiProperty({ example: 'vi' })
  locale: string;

  @ApiProperty({ example: 'SELECT Cơ Bản' })
  title: string;

  @ApiProperty({ example: '# Bài học\n\nNội dung markdown...' })
  contentMd: string;
}

export class LessonSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'select-co-ban' })
  slug: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'SELECT Cơ Bản' })
  title: string;

  @ApiProperty({ example: false })
  isPreview: boolean;

  @ApiProperty({ example: false, description: 'Whether the lesson has been completed by the current user (always false for guests)' })
  completed: boolean;
}

export class LessonDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'select-co-ban' })
  slug: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'SELECT Cơ Bản' })
  title: string;

  @ApiProperty({ example: '# Bài học\n\nNội dung markdown...' })
  contentMd: string;

  @ApiProperty({ example: false })
  isPreview: boolean;

  @ApiProperty({ example: false })
  translated: boolean;

  @ApiPropertyOptional({ example: 'select-nang-cao' })
  prevSlug?: string | null;

  @ApiPropertyOptional({ example: 'where-clause' })
  nextSlug?: string | null;
}

export class CourseListItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'sql-co-ban' })
  slug: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'SQL Cơ Bản' })
  title: string;

  @ApiProperty({ example: 'Làm quen với SQL căn bản' })
  description: string;

  @ApiProperty({ example: 10 })
  lessonsCount: number;

  @ApiProperty({ example: 3 })
  completedCount: number;
}

export class CourseDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'sql-co-ban' })
  slug: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'SQL Cơ Bản' })
  title: string;

  @ApiProperty({ example: 'Làm quen với SQL căn bản' })
  description: string;

  @ApiProperty({ type: [LessonSummaryDto] })
  lessons: LessonSummaryDto[];
}

export class ProgressItemDto {
  @ApiProperty({ example: 1 })
  lessonId: number;

  @ApiProperty({ example: 'select-co-ban' })
  lessonSlug: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  completedAt: Date;
}

export class LessonSearchResultDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'select-co-ban' })
  slug: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'SELECT Cơ Bản' })
  title: string;

  @ApiPropertyOptional({
    example: 'Cú pháp câu lệnh SELECT cơ bản...',
    description: 'Content snippet preview (omitted/null for guests viewing non-preview lessons)',
    nullable: true,
  })
  snippet?: string | null;

  @ApiProperty({ example: 'sql-co-ban' })
  courseSlug: string;

  @ApiProperty({ example: 'SQL Cơ Bản' })
  courseTitle: string;

  @ApiProperty({ example: false })
  isPreview: boolean;
}
