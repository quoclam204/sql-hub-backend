import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { RolesGuard } from '../../roles/roles.guard';
import { AdminLabsService } from './admin-labs.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

@ApiTags('Admin Content - Labs')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'admin/labs',
  version: '1',
})
export class AdminLabsController {
  constructor(private readonly labsService: AdminLabsService) {}

  @Get('datasets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of available datasets for lab creation' })
  findAllDatasets() {
    return this.labsService.findAllDatasets();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all labs (optionally filtered by lessonId)' })
  findAll(@Query('lessonId') lessonId?: string) {
    return this.labsService.findAll(lessonId ? Number(lessonId) : undefined);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single lab with dataset, lesson, and translations' })
  findOne(@Param('id') id: string) {
    return this.labsService.findOne(Number(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new SQL lab with expected query and bilingual content' })
  create(@Body() dto: CreateLabDto) {
    return this.labsService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update existing lab, dataset link, query, or translations' })
  update(@Param('id') id: string, @Body() dto: UpdateLabDto) {
    return this.labsService.update(Number(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a lab (guarded against cascading learner submission loss)' })
  delete(@Param('id') id: string) {
    return this.labsService.delete(Number(id));
  }
}
