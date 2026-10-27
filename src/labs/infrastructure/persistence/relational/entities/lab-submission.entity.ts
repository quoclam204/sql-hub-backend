import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { LabEntity } from './lab.entity';

@Entity({
  name: 'lab_submission',
})
export class LabSubmissionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => LabEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lab_id' })
  lab: LabEntity;

  @Column({ name: 'lab_id' })
  labId: number;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @Column({ type: 'int', default: 0, name: 'runtime_ms' })
  runtimeMs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
