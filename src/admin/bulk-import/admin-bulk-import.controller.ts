import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { RolesGuard } from '../../roles/roles.guard';
import { AdminBulkImportService } from './admin-bulk-import.service';
import { BulkImportRequestDto } from './dto/bulk-import.dto';

@ApiTags('Admin Content - Bulk Import')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'admin/bulk-import',
  version: '1',
})
export class AdminBulkImportController {
  constructor(private readonly bulkImportService: AdminBulkImportService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Bulk import lessons, quiz questions, or labs from JSON or Markdown (supports dryRun preview mode)',
  })
  @ApiOkResponse({
    description: 'Bulk import completed or validated successfully',
  })
  execute(@Body() dto: BulkImportRequestDto) {
    return this.bulkImportService.execute(dto);
  }

  @Get('templates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get sample JSON and Markdown templates for lessons, quiz questions, and labs',
  })
  @ApiOkResponse({
    description: 'Sample templates retrieved successfully',
  })
  getTemplates() {
    return this.bulkImportService.getSampleTemplates();
  }
}
