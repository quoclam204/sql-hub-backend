import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminLabsService } from './admin-labs.service';
import { LabEntity } from '../../labs/infrastructure/persistence/relational/entities/lab.entity';
import { DatasetEntity } from '../../labs/infrastructure/persistence/relational/entities/dataset.entity';
import { LabTranslationEntity } from '../../labs/infrastructure/persistence/relational/entities/lab-translation.entity';
import { LabSubmissionEntity } from '../../labs/infrastructure/persistence/relational/entities/lab-submission.entity';
import { LessonEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson.entity';

describe('AdminLabsService', () => {
  let service: AdminLabsService;
  let labRepo: jest.Mocked<Partial<Repository<LabEntity>>>;
  let datasetRepo: jest.Mocked<Partial<Repository<DatasetEntity>>>;
  let translationRepo: jest.Mocked<Partial<Repository<LabTranslationEntity>>>;
  let submissionRepo: jest.Mocked<Partial<Repository<LabSubmissionEntity>>>;
  let lessonRepo: jest.Mocked<Partial<Repository<LessonEntity>>>;

  beforeEach(async () => {
    labRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    datasetRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    translationRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    submissionRepo = {
      count: jest.fn(),
    };
    lessonRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLabsService,
        { provide: getRepositoryToken(LabEntity), useValue: labRepo },
        { provide: getRepositoryToken(DatasetEntity), useValue: datasetRepo },
        { provide: getRepositoryToken(LabTranslationEntity), useValue: translationRepo },
        { provide: getRepositoryToken(LabSubmissionEntity), useValue: submissionRepo },
        { provide: getRepositoryToken(LessonEntity), useValue: lessonRepo },
      ],
    }).compile();

    service = module.get<AdminLabsService>(AdminLabsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if dataset does not exist', async () => {
      (datasetRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create({
          datasetId: 999,
          expectedQuery: 'SELECT * FROM users;',
          titleVi: 'Bài Lab 1',
          titleEn: 'Lab 1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if expectedQuery is not a SELECT/WITH query', async () => {
      (datasetRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as DatasetEntity);

      await expect(
        service.create({
          datasetId: 1,
          expectedQuery: 'DROP TABLE users;',
          titleVi: 'Bài Lab 1',
          titleEn: 'Lab 1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create lab and bilingual translations successfully', async () => {
      (datasetRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 } as DatasetEntity);
      (labRepo.create as jest.Mock).mockReturnValue({ id: 5, datasetId: 1 });
      (labRepo.save as jest.Mock).mockResolvedValue({ id: 5, datasetId: 1 });
      (translationRepo.create as jest.Mock).mockImplementation((d) => d);
      (translationRepo.save as jest.Mock).mockResolvedValue([]);

      (labRepo.findOne as jest.Mock).mockResolvedValue({
        id: 5,
        datasetId: 1,
        expectedQuery: 'SELECT * FROM users;',
        translations: [
          { id: 1, locale: 'vi', title: 'Lab 1 Tiếng Việt', description: '', hint: '' },
          { id: 2, locale: 'en', title: 'Lab 1 English', description: '', hint: '' },
        ],
      } as unknown as LabEntity);

      const result = await service.create({
        datasetId: 1,
        expectedQuery: 'SELECT * FROM users;',
        titleVi: 'Lab 1 Tiếng Việt',
        titleEn: 'Lab 1 English',
      });

      expect(result.id).toBe(5);
      expect(result.titleVi).toBe('Lab 1 Tiếng Việt');
      expect(result.titleEn).toBe('Lab 1 English');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if lab does not exist', async () => {
      (labRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(404)).rejects.toThrow(NotFoundException);
    });

    it('should prevent deletion and throw BadRequestException if learners have submissions', async () => {
      (labRepo.findOne as jest.Mock).mockResolvedValue({ id: 5 } as LabEntity);
      (submissionRepo.count as jest.Mock).mockResolvedValue(12);

      await expect(service.delete(5)).rejects.toThrow(BadRequestException);
      expect(labRepo.remove).not.toHaveBeenCalled();
    });

    it('should safely delete lab when no submissions exist', async () => {
      const mockLab = { id: 5 } as LabEntity;
      (labRepo.findOne as jest.Mock).mockResolvedValue(mockLab);
      (submissionRepo.count as jest.Mock).mockResolvedValue(0);
      (labRepo.remove as jest.Mock).mockResolvedValue(mockLab);

      const result = await service.delete(5);

      expect(result.success).toBe(true);
      expect(labRepo.remove).toHaveBeenCalledWith(mockLab);
    });
  });
});
