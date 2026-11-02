import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { QuizQuestionEntity } from './quiz-question.entity';

@Entity({
  name: 'quiz_question_translation',
})
@Index(['question', 'locale'], { unique: true })
export class QuizQuestionTranslationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QuizQuestionEntity, (question) => question.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestionEntity;

  @Column({ name: 'question_id' })
  questionId: number;

  @Column({ type: String, length: 10, default: 'vi' })
  locale: string;

  @Column({ type: 'text', name: 'question_text' })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  explanation?: string;
}
