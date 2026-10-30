import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum BulkImportTypeEnum {
  LESSONS = 'lessons',
  QUIZ_QUESTIONS = 'quiz-questions',
  LABS = 'labs',
}

export enum BulkImportFormatEnum {
  JSON = 'json',
  MARKDOWN = 'markdown',
}

export class BulkImportRequestDto {
  @ApiProperty({
    enum: BulkImportTypeEnum,
    example: BulkImportTypeEnum.LESSONS,
    description: 'Type of content to import: lessons, quiz-questions, or labs',
  })
  @IsEnum(BulkImportTypeEnum)
  @IsNotEmpty()
  type: BulkImportTypeEnum;

  @ApiProperty({
    enum: BulkImportFormatEnum,
    example: BulkImportFormatEnum.JSON,
    description: 'Format of input content: json or markdown',
  })
  @IsEnum(BulkImportFormatEnum)
  @IsNotEmpty()
  format: BulkImportFormatEnum;

  @ApiProperty({
    example: '[{"courseId": 1, "slug": "intro-sql", "titleVi": "Nhập môn SQL", "titleEn": "Intro to SQL", "contentVi": "# Lý thuyết...", "contentEn": "# Theory..."}]',
    description: 'Raw JSON or Markdown content string',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: false,
    description: 'If true, validates and parses content without writing to database',
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

export interface BulkImportErrorItem {
  index: number;
  identifier?: string;
  field?: string;
  message: string;
}

export interface BulkImportResponseDto {
  success: boolean;
  type: BulkImportTypeEnum;
  dryRun: boolean;
  totalCount: number;
  importedCount: number;
  errors: BulkImportErrorItem[];
  preview?: any[];
}
