import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LessonTranslationItemDto {
  @ApiProperty({ example: 'vi', description: 'Locale code (vi or en)' })
  @IsString()
  @IsNotEmpty()
  locale: string;

  @ApiProperty({ example: '1. Nhập môn SQL', description: 'Lesson title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: '# Cú pháp SELECT cơ bản\n\nSELECT * FROM users;',
    description: 'Markdown content',
  })
  @IsString()
  @IsNotEmpty()
  contentMd: string;
}

export class CreateLessonDto {
  @ApiProperty({ example: 1, description: 'ID of the course this lesson belongs to' })
  @IsInt()
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({ example: 'select-co-ban', description: 'Unique slug for lesson' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 1, description: 'Sort order in course' })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({
    example: '1. Cú pháp SELECT cơ bản',
    description: 'Vietnamese title (convenience field)',
  })
  @IsOptional()
  @IsString()
  titleVi?: string;

  @ApiPropertyOptional({
    example: '# Hướng dẫn SELECT trong SQL\n\n...',
    description: 'Vietnamese Markdown content (convenience field)',
  })
  @IsOptional()
  @IsString()
  contentVi?: string;

  @ApiPropertyOptional({
    example: '1. Basic SELECT Syntax',
    description: 'English title (convenience field)',
  })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({
    example: '# Guide to SELECT in SQL\n\n...',
    description: 'English Markdown content (convenience field)',
  })
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiPropertyOptional({
    type: [LessonTranslationItemDto],
    description: 'Array of translations for vi and en',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonTranslationItemDto)
  translations?: LessonTranslationItemDto[];
}
