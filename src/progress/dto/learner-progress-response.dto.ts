import { ApiProperty } from '@nestjs/swagger';

export class QuizStatsDto {
  @ApiProperty({
    example: 5,
    description: 'Total number of quiz attempts made by learner',
  })
  totalAttempts: number;

  @ApiProperty({
    example: 85.5,
    description: 'Average score across all quiz attempts',
  })
  averageScore: number;

  @ApiProperty({
    example: 100,
    description: 'Highest score achieved by learner',
  })
  highestScore: number;

  @ApiProperty({
    example: 3,
    description: 'Number of distinct quizzes completed',
  })
  completedQuizzesCount: number;
}

export class LearnerProgressDto {
  @ApiProperty({
    example: 12,
    description: 'Number of lessons completed by learner',
  })
  completedLessonsCount: number;

  @ApiProperty({
    example: 30,
    description: 'Total number of available lessons',
  })
  totalLessonsCount: number;

  @ApiProperty({
    type: () => QuizStatsDto,
    description: 'Quiz performance statistics',
  })
  quizStats: QuizStatsDto;

  @ApiProperty({
    example: 4,
    description: 'Number of unique labs passed by learner',
  })
  passedLabsCount: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of available labs',
  })
  totalLabsCount: number;
}
