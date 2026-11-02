import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestionOptionDto {
  @ApiProperty({ example: 'SELECT * FROM users;', description: 'Option text in Vietnamese' })
  @IsString()
  @IsNotEmpty()
  optionTextVi: string;

  @ApiPropertyOptional({ example: 'SELECT * FROM users;', description: 'Option text in English' })
  @IsOptional()
  @IsString()
  optionTextEn?: string;

  @ApiProperty({ example: true, description: 'Whether this option is the correct answer' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Display order of option' })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateQuizQuestionDto {
  @ApiProperty({ example: 1, description: 'ID of the quiz this question belongs to' })
  @IsInt()
  @IsNotEmpty()
  quizId: number;

  @ApiPropertyOptional({ example: 1, description: 'Order of question in quiz' })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({
    example: 'Câu lệnh nào dùng để lấy dữ liệu từ bảng?',
    description: 'Question text in Vietnamese',
  })
  @IsString()
  @IsNotEmpty()
  questionTextVi: string;

  @ApiPropertyOptional({
    example: 'SELECT là câu lệnh cơ bản nhất trong SQL để truy xuất dữ liệu.',
    description: 'Explanation in Vietnamese',
  })
  @IsOptional()
  @IsString()
  explanationVi?: string;

  @ApiProperty({
    example: 'Which statement is used to retrieve data from a database?',
    description: 'Question text in English',
  })
  @IsString()
  @IsNotEmpty()
  questionTextEn: string;

  @ApiPropertyOptional({
    example: 'SELECT is the fundamental command in SQL to query data.',
    description: 'Explanation in English',
  })
  @IsOptional()
  @IsString()
  explanationEn?: string;

  @ApiProperty({
    type: [CreateQuestionOptionDto],
    description: 'List of answer choices (minimum 2 options, exactly 1 must be correct)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options: CreateQuestionOptionDto[];
}
