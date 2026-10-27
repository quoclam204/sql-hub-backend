import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryCourseDto {
  @ApiPropertyOptional({ example: 'vi', default: 'vi' })
  @IsOptional()
  @IsString()
  locale?: string;
}
