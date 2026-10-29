import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { QuizQuestionEntity } from './quiz-question.entity';
import { QuestionOptionTranslationEntity } from './question-option-translation.entity';

@Entity({
  name: 'question_option',
})
export class QuestionOptionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QuizQuestionEntity, (q) => q.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestionEntity;

  @Column({ name: 'question_id' })
  questionId: number;

  @OneToMany(
    () => QuestionOptionTranslationEntity,
    (translation) => translation.option,
    { cascade: true },
  )
  translations: QuestionOptionTranslationEntity[];

  @Column({ type: 'boolean', default: false, name: 'is_correct' })
  isCorrect: boolean;

  @Column({ type: 'int', default: 1 })
  order: number;
}
