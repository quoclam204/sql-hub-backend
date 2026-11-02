import { ApiProperty } from '@nestjs/swagger';

export class LabStatItemDto {
  @ApiProperty({ example: 1, description: 'ID of the lab' })
  labId: number;

  @ApiProperty({ example: 'Lọc nhân viên theo phòng ban', description: 'Lab title in Vietnamese' })
  titleVi: string;

  @ApiProperty({ example: 'Filter Employees by Department', description: 'Lab title in English' })
  titleEn: string;

  @ApiProperty({ example: 45, description: 'Total submissions for this lab' })
  totalSubmissions: number;

  @ApiProperty({ example: 38, description: 'Total passed submissions for this lab' })
  passedSubmissions: number;

  @ApiProperty({ example: 84.4, description: 'Pass rate percentage (0 - 100)' })
  passRate: number;

  @ApiProperty({ example: 120, description: 'Average runtime in milliseconds' })
  averageRuntimeMs: number;
}

export class AdminStatisticsOverviewDto {
  @ApiProperty({ example: 120, description: 'Total registered learners (users)' })
  totalLearners: number;

  @ApiProperty({ example: 85, description: 'Active learners with at least one lesson, quiz, or lab activity' })
  activeLearners: number;

  @ApiProperty({ example: 25, description: 'Total published lessons' })
  totalLessons: number;

  @ApiProperty({ example: 340, description: 'Total completed lesson records across all learners' })
  completedLessonsCount: number;

  @ApiProperty({ example: 15, description: 'Total interactive SQL practice labs' })
  totalLabs: number;

  @ApiProperty({ example: 520, description: 'Total SQL lab submissions recorded' })
  totalSubmissions: number;

  @ApiProperty({ example: 412, description: 'Total successful (passed) SQL lab submissions' })
  passedSubmissions: number;

  @ApiProperty({ example: 79.2, description: 'Overall lab submission pass rate percentage (0 - 100)' })
  labPassRate: number;

  @ApiProperty({ example: 76.5, description: 'Percentage of learners attempting labs who passed at least one lab' })
  learnerLabPassRate: number;

  @ApiProperty({ example: 210, description: 'Total quiz attempts taken by learners' })
  totalQuizAttempts: number;

  @ApiProperty({ example: 8.5, description: 'Average score across all quiz attempts' })
  averageQuizScore: number;
}

export class AdminStatisticsResponseDto {
  @ApiProperty({ type: AdminStatisticsOverviewDto })
  overview: AdminStatisticsOverviewDto;

  @ApiProperty({ type: [LabStatItemDto] })
  labsStatistics: LabStatItemDto[];
}
