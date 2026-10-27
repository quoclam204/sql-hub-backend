import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { LessonEntity } from './lesson.entity';

@Entity({
  name: 'lesson_progress',
})
@Index(['user', 'lesson'], { unique: true })
export class LessonProgressEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => LessonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: LessonEntity;

  @Column({ name: 'lesson_id' })
  lessonId: number;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt: Date;
}
