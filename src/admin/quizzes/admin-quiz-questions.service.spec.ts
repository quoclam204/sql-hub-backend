import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminQuizQuestionsService } from './admin-quiz-questions.service';
import { QuizEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz.entity';
import { QuizQuestionEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-question.entity';
import { QuestionOptionEntity } from '../../quizzes/infrastructure/persistence/relational/entities/question-option.entity';
import { QuizQuestionTranslationEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-question-translation.entity';

describe('AdminQuizQuestionsService', () => {
  let service: AdminQuizQuestionsService;
  let questionRepo: jest.Mocked<Partial<Repository<QuizQuestionEntity>>>;
  let optionRepo: jest.Mocked<Partial<Repository<QuestionOptionEntity>>>;
  let translationRepo: jest.Mocked<Partial<Repository<QuizQuestionTranslationEntity>>>;
  let quizRepo: jest.Mocked<Partial<Repository<QuizEntity>>>;

  beforeEach(async () => {
    questionRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    optionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    translationRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    quizRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminQuizQuestionsService,
        { provide: getRepositoryToken(QuizQuestionEntity), useValue: questionRepo },
        { provide: getRepositoryToken(QuestionOptionEntity), useValue: optionRepo },
        { provide: getRepositoryToken(QuizQuestionTranslationEntity), useValue: translationRepo },
        { provide: getRepositoryToken(QuizEntity), useValue: quizRepo },
      ],
    }).compile();

    service = module.get<AdminQuizQuestionsService>(AdminQuizQuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if quiz does not exist', async () => {
      (quizRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create({
          quizId: 999,
          questionTextVi: 'Câu hỏi?',
          questionTextEn: 'Question?',
          options: [
            { optionTextVi: 'A', isCorrect: true },
            { optionTextVi: 'B', isCorrect: false },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if less than 2 options provided', async () => {
      (quizRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as QuizEntity);

      await expect(
        service.create({
          quizId: 1,
          questionTextVi: 'Câu hỏi?',
          questionTextEn: 'Question?',
          options: [{ optionTextVi: 'A', isCorrect: true }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no option is marked as correct', async () => {
      (quizRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as QuizEntity);

      await expect(
        service.create({
          quizId: 1,
          questionTextVi: 'Câu hỏi?',
          questionTextEn: 'Question?',
          options: [
            { optionTextVi: 'A', isCorrect: false },
            { optionTextVi: 'B', isCorrect: false },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if multiple options are marked as correct', async () => {
      (quizRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as QuizEntity);

      await expect(
        service.create({
          quizId: 1,
          questionTextVi: 'Câu hỏi?',
          questionTextEn: 'Question?',
          options: [
            { optionTextVi: 'A', isCorrect: true },
            { optionTextVi: 'B', isCorrect: true },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create question, bilingual translations, and options successfully', async () => {
      (quizRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as QuizEntity);
      (questionRepo.create as jest.Mock).mockReturnValue({ id: 10, quizId: 1 });
      (questionRepo.save as jest.Mock).mockResolvedValue({ id: 10, quizId: 1 });
      (translationRepo.create as jest.Mock).mockImplementation((d) => d);
      (translationRepo.save as jest.Mock).mockResolvedValue([]);
      (optionRepo.create as jest.Mock).mockImplementation((d) => d);
      (optionRepo.save as jest.Mock).mockResolvedValue([]);

      (questionRepo.findOne as jest.Mock).mockResolvedValue({
        id: 10,
        quizId: 1,
        questionText: 'Lệnh nào dùng để đọc dữ liệu?',
        options: [
          { id: 1, optionText: 'SELECT', optionTextEn: 'SELECT', isCorrect: true, order: 1 },
          { id: 2, optionText: 'DELETE', optionTextEn: 'DELETE', isCorrect: false, order: 2 },
        ],
        translations: [
          { id: 1, locale: 'vi', questionText: 'Lệnh nào dùng để đọc dữ liệu?', explanation: '' },
          { id: 2, locale: 'en', questionText: 'Which command is used to read data?', explanation: '' },
        ],
      } as unknown as QuizQuestionEntity);

      const result = await service.create({
        quizId: 1,
        questionTextVi: 'Lệnh nào dùng để đọc dữ liệu?',
        questionTextEn: 'Which command is used to read data?',
        options: [
          { optionTextVi: 'SELECT', optionTextEn: 'SELECT', isCorrect: true, order: 1 },
          { optionTextVi: 'DELETE', optionTextEn: 'DELETE', isCorrect: false, order: 2 },
        ],
      });

      expect(result.id).toBe(10);
      expect(result.options.length).toBe(2);
      expect(result.questionTextVi).toBe('Lệnh nào dùng để đọc dữ liệu?');
      expect(result.questionTextEn).toBe('Which command is used to read data?');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if question does not exist', async () => {
      (questionRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(99)).rejects.toThrow(NotFoundException);
    });

    it('should delete question successfully', async () => {
      const mockQuestion = { id: 10 } as QuizQuestionEntity;
      (questionRepo.findOne as jest.Mock).mockResolvedValue(mockQuestion);
      (questionRepo.remove as jest.Mock).mockResolvedValue(mockQuestion);

      const result = await service.delete(10);

      expect(result.success).toBe(true);
      expect(questionRepo.remove).toHaveBeenCalledWith(mockQuestion);
    });
  });
});
