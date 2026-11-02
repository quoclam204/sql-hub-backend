import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProgressService } from './progress.service';
import {
  BadgeDto,
  LearnerProgressDto,
  StreakInfoDto,
} from './dto/learner-progress-response.dto';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';

interface RequestWithUser {
  user: JwtPayloadType;
}

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'progress',
  version: '1',
})
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get comprehensive progress summary for current learner (including streaks and badges)',
  })
  @ApiOkResponse({
    type: LearnerProgressDto,
    description: 'Get progress summary for current authenticated learner',
  })
  getLearnerProgress(
    @Request() request: RequestWithUser,
  ): Promise<LearnerProgressDto> {
    return this.progressService.getLearnerProgress(Number(request.user.id));
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alias to get progress summary for current authenticated learner',
  })
  @ApiOkResponse({
    type: LearnerProgressDto,
    description:
      'Alias to get progress summary for current authenticated learner',
  })
  getLearnerProgressAlias(
    @Request() request: RequestWithUser,
  ): Promise<LearnerProgressDto> {
    return this.progressService.getLearnerProgress(Number(request.user.id));
  }

  @Get('streaks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get streak metrics and active days for current learner (FR-PROG-02)',
  })
  @ApiOkResponse({
    type: StreakInfoDto,
    description:
      'Current and longest learning streaks with active calendar dates',
  })
  getLearnerStreak(
    @Request() request: RequestWithUser,
  ): Promise<StreakInfoDto> {
    return this.progressService.getLearnerStreak(Number(request.user.id));
  }

  @Get('badges')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get gamification badges awarded to current learner (FR-PROG-02)',
  })
  @ApiOkResponse({
    type: [BadgeDto],
    description: 'List of earned and available achievement badges',
  })
  getLearnerBadges(@Request() request: RequestWithUser): Promise<BadgeDto[]> {
    return this.progressService.getLearnerBadges(Number(request.user.id));
  }
}
