import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CourseEntity } from './infrastructure/persistence/relational/entities/course.entity';
import { QuizEntity } from '../quizzes/infrastructure/persistence/relational/entities/quiz.entity';
import { LabEntity } from '../labs/infrastructure/persistence/relational/entities/lab.entity';

describe('CoursesService learner content', () => {
  let service: CoursesService;
  const courseRepo = { findOne: jest.fn(), find: jest.fn() };
  const quizRepo = { find: jest.fn() };
  const labRepo = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(CourseEntity), useValue: courseRepo },
        { provide: getRepositoryToken(QuizEntity), useValue: quizRepo },
        { provide: getRepositoryToken(LabEntity), useValue: labRepo },
      ],
    }).compile();
    service = module.get(CoursesService);
  });

  it('should select the requested translation and fall back to English', async () => {
    courseRepo.findOne.mockResolvedValue({
      slug: 'sql-basics',
      translations: [{ locale: 'en', title: 'SQL Basics' }],
      lessons: [
        {
          id: 1,
          slug: 'select',
          order: 1,
          translations: [
            { locale: 'en', title: 'SELECT', contentMd: 'SELECT *' },
          ],
        },
      ],
    });
    quizRepo.find.mockResolvedValue([]);
    labRepo.find.mockResolvedValue([]);

    await expect(
      service.findLesson('sql-basics', 'select', 'vi'),
    ).resolves.toMatchObject({
      lesson: { title: 'SELECT', contentMd: 'SELECT *' },
      course: { title: 'SQL Basics' },
    });
  });

  it('should return localized quiz options without exposing the solution query', async () => {
    courseRepo.findOne.mockResolvedValue({
      slug: 'sql-basics',
      translations: [{ locale: 'vi', title: 'SQL Cơ bản' }],
      lessons: [
        {
          id: 1,
          slug: 'select',
          order: 1,
          translations: [
            { locale: 'vi', title: 'SELECT', contentMd: '# SELECT' },
          ],
        },
      ],
    });
    quizRepo.find.mockResolvedValue([
      {
        id: 2,
        title: 'Quiz',
        questions: [
          {
            id: 3,
            order: 1,
            questionText: 'fallback',
            translations: [
              { locale: 'en', questionText: 'Which?', explanation: 'Read' },
            ],
            options: [
              { id: 4, order: 1, optionText: 'Chọn', optionTextEn: 'Choose' },
            ],
          },
        ],
      },
    ]);
    labRepo.find.mockResolvedValue([]);

    const result = await service.findLesson('sql-basics', 'select', 'en');
    expect(result?.quizzes[0].questions[0]).toMatchObject({
      questionText: 'Which?',
      options: [{ optionText: 'Choose' }],
    });
    expect(result?.quizzes[0].questions[0]).not.toHaveProperty('isCorrect');
    expect(JSON.stringify(result)).not.toContain('expectedQuery');
  });
});
