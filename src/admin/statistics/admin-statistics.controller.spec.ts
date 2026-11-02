import { Test, TestingModule } from '@nestjs/testing';
import { AdminStatisticsController } from './admin-statistics.controller';
import { AdminStatisticsService } from './admin-statistics.service';
import { AdminStatisticsResponseDto } from './dto/admin-statistics-response.dto';

describe('AdminStatisticsController', () => {
  let controller: AdminStatisticsController;
  let service: jest.Mocked<AdminStatisticsService>;

  beforeEach(async () => {
    const mockService = {
      getStatistics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminStatisticsController],
      providers: [
        {
          provide: AdminStatisticsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AdminStatisticsController>(
      AdminStatisticsController,
    );
    service = module.get(AdminStatisticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate getStatistics to service and return statistics', async () => {
    const mockResponse: AdminStatisticsResponseDto = {
      overview: {
        totalLearners: 50,
        activeLearners: 35,
        totalLessons: 10,
        completedLessonsCount: 80,
        totalLabs: 5,
        totalSubmissions: 120,
        passedSubmissions: 96,
        labPassRate: 80.0,
        learnerLabPassRate: 75.0,
        totalQuizAttempts: 40,
        averageQuizScore: 8.5,
      },
      labsStatistics: [
        {
          labId: 1,
          titleVi: 'Bài 1',
          titleEn: 'Lab 1',
          totalSubmissions: 50,
          passedSubmissions: 40,
          passRate: 80.0,
          averageRuntimeMs: 85,
        },
      ],
    };

    service.getStatistics.mockResolvedValue(mockResponse);

    const result = await controller.getStatistics();
    expect(result).toBe(mockResponse);
    expect(service.getStatistics).toHaveBeenCalledTimes(1);
  });
});
