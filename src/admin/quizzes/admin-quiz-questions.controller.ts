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
import { AdminQuizQuestionsService } from './admin-quiz-questions.service';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';

@ApiTags('Admin Content - Quiz Questions')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'admin/quiz-questions',
  version: '1',
})
export class AdminQuizQuestionsController {
  constructor(private readonly quizQuestionsService: AdminQuizQuestionsService) {}

  @Get('quizzes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of available quizzes for question creation' })
  findAllQuizzes() {
    return this.quizQuestionsService.findAllQuizzes();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all quiz questions (optionally filtered by quizId)' })
  findAll(@Query('quizId') quizId?: string) {
    return this.quizQuestionsService.findAll(quizId ? Number(quizId) : undefined);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single quiz question with options and translations' })
  findOne(@Param('id') id: string) {
    return this.quizQuestionsService.findOne(Number(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new quiz question with options and bilingual content' })
  create(@Body() dto: CreateQuizQuestionDto) {
    return this.quizQuestionsService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update existing quiz question, options, and translations' })
  update(@Param('id') id: string, @Body() dto: UpdateQuizQuestionDto) {
    return this.quizQuestionsService.update(Number(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a quiz question and its options' })
  delete(@Param('id') id: string) {
    return this.quizQuestionsService.delete(Number(id));
  }
}
