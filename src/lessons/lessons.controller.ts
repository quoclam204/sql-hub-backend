import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LessonsService } from './lessons.service';
import { QueryLessonDto, SearchLessonDto } from './dto/query-lesson.dto';
import {
  LessonDetailDto,
  ProgressItemDto,
  LessonSearchResultDto,
} from './dto/lesson-response.dto';
import type { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

interface RequestWithUser extends Request {
  user?: JwtPayloadType;
}

@ApiTags('Lessons')
@Controller({ version: '1' })
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // ── GET /lessons/search ───────────────────────────────────────────────────
  // Note: Defined before /lessons/:slug so that 'search' is not treated as a slug

  @Get('lessons/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Search published lessons by keyword (title or SQL syntax; guests receive snippets only for preview lessons)',
  })
  @ApiOkResponse({ type: [LessonSearchResultDto] })
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  async searchLessons(
    @Query() query: SearchLessonDto,
    @Req() req: RequestWithUser,
  ): Promise<LessonSearchResultDto[]> {
    const userId = req.user?.id;
    return this.lessonsService.searchLessons(
      query.q,
      query.locale ?? 'vi',
      userId,
    );
  }

  // ── GET /lessons/:slug ────────────────────────────────────────────────────

  @Get('lessons/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single lesson with prev/next navigation' })
  @ApiOkResponse({ type: LessonDetailDto })
  @ApiNotFoundResponse({ description: 'Lesson not found' })
  @ApiForbiddenResponse({
    description: 'Not a preview lesson — authentication required',
  })
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  async findLessonBySlug(
    @Param('slug') slug: string,
    @Query() query: QueryLessonDto,
    @Req() req: RequestWithUser,
  ): Promise<LessonDetailDto> {
    const userId = req.user?.id;
    return this.lessonsService.findLessonBySlug(
      slug,
      query.locale ?? 'vi',
      userId,
    );
  }

  // ── POST /lessons/:id/complete ────────────────────────────────────────────

  @Post('lessons/:id/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a lesson as completed (idempotent)' })
  @ApiCreatedResponse({ description: 'Lesson marked as completed' })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  @ApiNotFoundResponse({ description: 'Lesson not found' })
  @UseGuards(AuthGuard('jwt'))
  async completeLesson(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req.user!.id;
    return this.lessonsService.completeLesson(id, userId);
  }

  // ── GET /progress ─────────────────────────────────────────────────────────

  @Get('progress')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all completed lessons for the current user' })
  @ApiOkResponse({ type: [ProgressItemDto] })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  @UseGuards(AuthGuard('jwt'))
  async getProgress(@Req() req: RequestWithUser): Promise<ProgressItemDto[]> {
    const userId = req.user!.id;
    return this.lessonsService.getProgress(userId);
  }
}
