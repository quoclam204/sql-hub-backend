import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { LessonEntity } from '../../../../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { DatasetEntity } from './dataset.entity';
import { LabTranslationEntity } from './lab-translation.entity';

@Entity({
  name: 'lab',
})
export class LabEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LessonEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: LessonEntity | null;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: number | null;

  @ManyToOne(() => DatasetEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'dataset_id' })
  dataset: DatasetEntity;

  @Column({ name: 'dataset_id' })
  datasetId: number;

  @Column({ type: 'text', name: 'expected_query' })
  expectedQuery: string;

  @Column({ type: 'boolean', default: false, name: 'order_sensitive' })
  orderSensitive: boolean;

  @OneToMany(() => LabTranslationEntity, (translation) => translation.lab, {
    cascade: true,
  })
  translations: LabTranslationEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
