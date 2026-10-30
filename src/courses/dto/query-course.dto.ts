import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryCourseDto {
  @ApiPropertyOptional({ example: 'vi', default: 'vi' })
  @IsOptional()
  @IsString()
  @IsIn(['vi', 'en'])
  locale?: string;
}
