import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz.entity';
import { QuizQuestionEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-question.entity';
import { QuestionOptionEntity } from '../../quizzes/infrastructure/persistence/relational/entities/question-option.entity';
import { QuizQuestionTranslationEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-question-translation.entity';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';

@Injectable()
export class AdminQuizQuestionsService {
  constructor(
    @InjectRepository(QuizQuestionEntity)
    private readonly questionRepo: Repository<QuizQuestionEntity>,
    @InjectRepository(QuestionOptionEntity)
    private readonly optionRepo: Repository<QuestionOptionEntity>,
    @InjectRepository(QuizQuestionTranslationEntity)
    private readonly translationRepo: Repository<QuizQuestionTranslationEntity>,
    @InjectRepository(QuizEntity)
    private readonly quizRepo: Repository<QuizEntity>,
  ) {}

  async findAllQuizzes() {
    const quizzes = await this.quizRepo.find({
      relations: ['lesson', 'lesson.translations'],
      order: { id: 'ASC' },
    });

    return quizzes.map((q) => {
      const lessonTitle =
        q.lesson?.translations?.find((t) => t.locale === 'vi')?.title ||
        q.lesson?.slug;
      return {
        id: q.id,
        lessonId: q.lessonId,
        title: q.title,
        lessonTitle: lessonTitle || `Quiz #${q.id}`,
      };
    });
  }

  async findAll(quizId?: number) {
    const query = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.quiz', 'quiz')
      .leftJoinAndSelect('q.options', 'option')
      .leftJoinAndSelect('q.translations', 'translation')
      .orderBy('q.order', 'ASC')
      .addOrderBy('option.order', 'ASC');

    if (quizId) {
      query.where('q.quizId = :quizId', { quizId });
    }

    const questions = await query.getMany();

    return questions.map((q) => {
      const vi = q.translations?.find((t) => t.locale === 'vi');
      const en = q.translations?.find((t) => t.locale === 'en');
      return {
        id: q.id,
        quizId: q.quizId,
        quizTitle: q.quiz?.title,
        order: q.order,
        questionTextVi: vi?.questionText || q.questionText,
        explanationVi: vi?.explanation || q.explanation || '',
        questionTextEn: en?.questionText || '',
        explanationEn: en?.explanation || '',
        options: (q.options || []).map((opt) => ({
          id: opt.id,
          optionTextVi: opt.optionText,
          optionTextEn: opt.optionTextEn || opt.optionText,
          isCorrect: opt.isCorrect,
          order: opt.order,
        })),
        createdAt: q.createdAt,
      };
    });
  }

  async findOne(id: number) {
    const question = await this.questionRepo.findOne({
      where: { id: Number(id) },
      relations: ['quiz', 'options', 'translations'],
    });

    if (!question) {
      throw new NotFoundException(`Quiz question with ID ${id} not found`);
    }

    const vi = question.translations?.find((t) => t.locale === 'vi');
    const en = question.translations?.find((t) => t.locale === 'en');

    return {
      id: question.id,
      quizId: question.quizId,
      quizTitle: question.quiz?.title,
      order: question.order,
      questionTextVi: vi?.questionText || question.questionText,
      explanationVi: vi?.explanation || question.explanation || '',
      questionTextEn: en?.questionText || '',
      explanationEn: en?.explanation || '',
      options: (question.options || []).map((opt) => ({
        id: opt.id,
        optionTextVi: opt.optionText,
        optionTextEn: opt.optionTextEn || opt.optionText,
        isCorrect: opt.isCorrect,
        order: opt.order,
      })),
      createdAt: question.createdAt,
    };
  }

  async create(dto: CreateQuizQuestionDto) {
    // 1. Verify quiz exists
    const quiz = await this.quizRepo.findOne({ where: { id: dto.quizId } });
    if (!quiz) {
      throw new BadRequestException(`Quiz with ID ${dto.quizId} does not exist`);
    }

    // 2. Validate options
    if (!dto.options || dto.options.length < 2) {
      throw new BadRequestException('A quiz question must have at least 2 options');
    }

    const correctOptions = dto.options.filter((o) => o.isCorrect);
    if (correctOptions.length !== 1) {
      throw new BadRequestException(
        'A quiz question must have exactly one correct option',
      );
    }

    // 3. Create question
    const question = this.questionRepo.create({
      quizId: dto.quizId,
      order: dto.order ?? 1,
      questionText: dto.questionTextVi,
      explanation: dto.explanationVi || null,
    });
    const savedQuestion = await this.questionRepo.save(question);

    // 4. Create bilingual translations
    const translations = [
      this.translationRepo.create({
        questionId: savedQuestion.id,
        locale: 'vi',
        questionText: dto.questionTextVi,
        explanation: dto.explanationVi || null,
      }),
      this.translationRepo.create({
        questionId: savedQuestion.id,
        locale: 'en',
        questionText: dto.questionTextEn,
        explanation: dto.explanationEn || null,
      }),
    ];
    await this.translationRepo.save(translations);

    // 5. Create options
    const optionsToSave = dto.options.map((opt, index) =>
      this.optionRepo.create({
        questionId: savedQuestion.id,
        optionText: opt.optionTextVi,
        optionTextEn: opt.optionTextEn || opt.optionTextVi,
        isCorrect: opt.isCorrect,
        order: opt.order ?? index + 1,
      }),
    );
    await this.optionRepo.save(optionsToSave);

    return this.findOne(savedQuestion.id);
  }

  async update(id: number, dto: UpdateQuizQuestionDto) {
    const question = await this.questionRepo.findOne({
      where: { id: Number(id) },
      relations: ['options', 'translations'],
    });

    if (!question) {
      throw new NotFoundException(`Quiz question with ID ${id} not found`);
    }

    if (dto.quizId) {
      const quiz = await this.quizRepo.findOne({ where: { id: dto.quizId } });
      if (!quiz) {
        throw new BadRequestException(`Quiz with ID ${dto.quizId} does not exist`);
      }
      question.quizId = dto.quizId;
    }

    if (dto.order !== undefined) {
      question.order = dto.order;
    }

    if (dto.questionTextVi !== undefined) {
      question.questionText = dto.questionTextVi;
    }

    if (dto.explanationVi !== undefined) {
      question.explanation = dto.explanationVi || null;
    }

    await this.questionRepo.save(question);

    // Update translations
    const updateLocale = async (
      locale: string,
      questionText?: string,
      explanation?: string,
    ) => {
      if (questionText === undefined && explanation === undefined) return;
      let trans = question.translations?.find((t) => t.locale === locale);
      if (trans) {
        if (questionText !== undefined) trans.questionText = questionText;
        if (explanation !== undefined) trans.explanation = explanation || null;
        await this.translationRepo.save(trans);
      } else if (questionText !== undefined) {
        trans = this.translationRepo.create({
          questionId: question.id,
          locale,
          questionText,
          explanation: explanation || null,
        });
        await this.translationRepo.save(trans);
      }
    };

    if (dto.questionTextVi !== undefined || dto.explanationVi !== undefined) {
      await updateLocale('vi', dto.questionTextVi, dto.explanationVi);
    }
    if (dto.questionTextEn !== undefined || dto.explanationEn !== undefined) {
      await updateLocale('en', dto.questionTextEn, dto.explanationEn);
    }

    // Update options if provided
    if (dto.options) {
      if (dto.options.length < 2) {
        throw new BadRequestException('A quiz question must have at least 2 options');
      }
      const correctOptions = dto.options.filter((o) => o.isCorrect);
      if (correctOptions.length !== 1) {
        throw new BadRequestException(
          'A quiz question must have exactly one correct option',
        );
      }

      // Replace existing options
      if (question.options?.length > 0) {
        await this.optionRepo.remove(question.options);
      }

      const newOptions = dto.options.map((opt, index) =>
        this.optionRepo.create({
          questionId: question.id,
          optionText: opt.optionTextVi,
          optionTextEn: opt.optionTextEn || opt.optionTextVi,
          isCorrect: opt.isCorrect,
          order: opt.order ?? index + 1,
        }),
      );
      await this.optionRepo.save(newOptions);
    }

    return this.findOne(question.id);
  }

  async delete(id: number) {
    const question = await this.questionRepo.findOne({
      where: { id: Number(id) },
      relations: ['options'],
    });

    if (!question) {
      throw new NotFoundException(`Quiz question with ID ${id} not found`);
    }

    // Options and translations have onDelete: CASCADE, so remove safely deletes them
    await this.questionRepo.remove(question);

    return { success: true, message: `Quiz question ${id} successfully deleted` };
  }
}
