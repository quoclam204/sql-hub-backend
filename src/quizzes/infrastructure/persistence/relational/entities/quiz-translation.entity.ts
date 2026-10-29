import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { QuizEntity } from './quiz.entity';

@Entity({
  name: 'quiz_translation',
})
@Index(['quiz', 'locale'], { unique: true })
export class QuizTranslationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QuizEntity, (quiz) => quiz.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quiz_id' })
  quiz: QuizEntity;

  @Column({ name: 'quiz_id' })
  quizId: number;

  @Column({ type: String, length: 10, default: 'vi' })
  locale: string;

  @Column({ type: String })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
