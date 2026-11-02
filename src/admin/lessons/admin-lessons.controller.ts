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
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { RolesGuard } from '../../roles/roles.guard';
import { AdminLessonsService } from './admin-lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@ApiTags('Admin Content - Lessons')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'admin/lessons',
  version: '1',
})
export class AdminLessonsController {
  constructor(private readonly lessonsService: AdminLessonsService) {}

  @Get('courses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of available courses for lesson creation' })
  findAllCourses() {
    return this.lessonsService.findAllCourses();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all lessons (optionally filtered by courseId)' })
  findAll(@Query('courseId') courseId?: string) {
    return this.lessonsService.findAll(courseId ? Number(courseId) : undefined);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single lesson with translations by ID' })
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(Number(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new lesson with bilingual content' })
  create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update existing lesson and its translations' })
  update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(Number(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a lesson (guarded against cascading learner progress loss)' })
  delete(@Param('id') id: string) {
    return this.lessonsService.delete(Number(id));
  }
}
