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
import { QuizQuestionEntity } from './quiz-question.entity';

@Entity({
  name: 'quiz',
})
export class QuizEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LessonEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: LessonEntity | null;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId?: number | null;

  @Column({ type: String })
  title: string;

  @OneToMany(() => QuizQuestionEntity, (question) => question.quiz, {
    cascade: true,
  })
  questions: QuizQuestionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
