import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QueryLessonDto {
  @ApiPropertyOptional({ example: 'vi', default: 'vi' })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class SearchLessonDto {
  @ApiProperty({ example: 'SELECT', description: 'Search keyword (title or SQL syntax)' })
  @IsNotEmpty()
  @IsString()
  q: string;

  @ApiPropertyOptional({ example: 'vi', default: 'vi' })
  @IsOptional()
  @IsString()
  locale?: string;
}
