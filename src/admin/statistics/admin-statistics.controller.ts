import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { RolesGuard } from '../../roles/roles.guard';
import { AdminStatisticsService } from './admin-statistics.service';
import { AdminStatisticsResponseDto } from './dto/admin-statistics-response.dto';

@ApiTags('Admin - Statistics')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'admin/statistics',
  version: '1',
})
export class AdminStatisticsController {
  constructor(
    private readonly adminStatisticsService: AdminStatisticsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get aggregate admin platform statistics (learners, lab pass rates, quiz scores, and per-lab metrics)',
  })
  @ApiOkResponse({
    type: AdminStatisticsResponseDto,
    description: 'Admin statistics retrieved successfully',
  })
  async getStatistics(): Promise<AdminStatisticsResponseDto> {
    return this.adminStatisticsService.getStatistics();
  }
}
