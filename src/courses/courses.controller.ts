import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LessonsService } from '../lessons/lessons.service';
import { QueryCourseDto } from './dto/query-course.dto';
import {
  CourseListItemDto,
  CourseDetailDto,
} from '../lessons/dto/lesson-response.dto';
import type { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

interface RequestWithUser extends Request {
  user?: JwtPayloadType;
}

@ApiTags('Courses')
@Controller({
  path: 'courses',
  version: '1',
})
export class CoursesController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List published courses with completedCount' })
  @ApiOkResponse({ type: [CourseListItemDto] })
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  async findAll(
    @Query() query: QueryCourseDto,
    @Req() req: RequestWithUser,
  ): Promise<CourseListItemDto[]> {
    const userId = req.user?.id;
    return this.lessonsService.findAllCourses(query.locale ?? 'vi', userId);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get course details with lesson list (title, isPreview, completed)',
  })
  @ApiOkResponse({ type: CourseDetailDto })
  @ApiNotFoundResponse({ description: 'Course not found' })
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  async findBySlug(
    @Param('slug') slug: string,
    @Query() query: QueryCourseDto,
    @Req() req: RequestWithUser,
  ): Promise<CourseDetailDto> {
    const userId = req.user?.id;
    return this.lessonsService.findCourseBySlug(
      slug,
      query.locale ?? 'vi',
      userId,
    );
  }
}
