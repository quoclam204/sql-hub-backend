import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasetEntity } from './infrastructure/persistence/relational/entities/dataset.entity';
import { LabEntity } from './infrastructure/persistence/relational/entities/lab.entity';
import { LabSubmissionEntity } from './infrastructure/persistence/relational/entities/lab-submission.entity';
import { LabTranslationEntity } from './infrastructure/persistence/relational/entities/lab-translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DatasetEntity,
      LabEntity,
      LabSubmissionEntity,
      LabTranslationEntity,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class LabsModule {}
