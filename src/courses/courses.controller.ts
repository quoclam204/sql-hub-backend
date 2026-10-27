import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { QueryCourseDto } from './dto/query-course.dto';

@ApiTags('Courses')
@Controller({
  path: 'courses',
  version: '1',
})
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Get list of published courses in specified locale',
  })
  async findAll(@Query() query: QueryCourseDto) {
    return this.coursesService.findAll(query.locale || 'vi');
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Get course details with lessons in specified locale',
  })
  async findBySlug(
    @Param('slug') slug: string,
    @Query() query: QueryCourseDto,
  ) {
    return this.coursesService.findBySlug(slug, query.locale || 'vi');
  }
}
