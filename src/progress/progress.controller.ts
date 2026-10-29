import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProgressService } from './progress.service';
import { LearnerProgressDto } from './dto/learner-progress-response.dto';
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
  @ApiOkResponse({
    type: LearnerProgressDto,
    description: 'Alias to get progress summary for current authenticated learner',
  })
  getLearnerProgressAlias(
    @Request() request: RequestWithUser,
  ): Promise<LearnerProgressDto> {
    return this.progressService.getLearnerProgress(Number(request.user.id));
  }
}
