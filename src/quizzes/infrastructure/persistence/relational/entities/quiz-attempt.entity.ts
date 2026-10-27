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
import { QuizEntity } from './quiz.entity';

@Entity({
  name: 'quiz_attempt',
})
export class QuizAttemptEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => QuizEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: QuizEntity;

  @Column({ name: 'quiz_id' })
  quizId: number;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'jsonb', nullable: true })
  answers?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
