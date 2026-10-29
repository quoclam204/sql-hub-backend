import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLabDto {
  @ApiProperty({ example: 1, description: 'ID of the dataset to be used in this lab' })
  @IsInt()
  @IsNotEmpty()
  datasetId: number;

  @ApiPropertyOptional({ example: 1, description: 'Optional ID of the lesson linked to this lab' })
  @IsOptional()
  @IsInt()
  lessonId?: number;

  @ApiProperty({
    example: 'SELECT id, username, email FROM users WHERE is_active = true ORDER BY id ASC;',
    description: 'Expected SQL query solution',
  })
  @IsString()
  @IsNotEmpty()
  expectedQuery: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether row order matters during result comparison',
  })
  @IsOptional()
  @IsBoolean()
  orderSensitive?: boolean;

  @ApiProperty({
    example: 'Thực hành 1: Lọc người dùng đang hoạt động',
    description: 'Title of the lab in Vietnamese',
  })
  @IsString()
  @IsNotEmpty()
  titleVi: string;

  @ApiPropertyOptional({
    example: 'Viết câu truy vấn SELECT để lấy các cột id, username, email từ bảng users...',
    description: 'Detailed instructions in Vietnamese',
  })
  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @ApiPropertyOptional({
    example: 'Sử dụng mệnh đề WHERE is_active = true kết hợp với ORDER BY id ASC.',
    description: 'Helpful hint in Vietnamese',
  })
  @IsOptional()
  @IsString()
  hintVi?: string;

  @ApiProperty({
    example: 'Lab 1: Filter Active Users',
    description: 'Title of the lab in English',
  })
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiPropertyOptional({
    example: 'Write a SELECT query to retrieve id, username, email from the users table...',
    description: 'Detailed instructions in English',
  })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({
    example: 'Use the WHERE is_active = true clause combined with ORDER BY id ASC.',
    description: 'Helpful hint in English',
  })
  @IsOptional()
  @IsString()
  hintEn?: string;
}
