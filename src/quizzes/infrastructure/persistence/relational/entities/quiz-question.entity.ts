import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { QuizEntity } from './quiz.entity';
import { QuestionOptionEntity } from './question-option.entity';
import { QuizQuestionTranslationEntity } from './quiz-question-translation.entity';

@Entity({
  name: 'quiz_question',
})
export class QuizQuestionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QuizEntity, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: QuizEntity;

  @Column({ name: 'quiz_id' })
  quizId: number;

  @Column({ type: 'int', default: 1 })
  order: number;

  @Column({ type: 'text', name: 'question_text' })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @OneToMany(() => QuestionOptionEntity, (opt) => opt.question, {
    cascade: true,
  })
  options: QuestionOptionEntity[];

  @OneToMany(
    () => QuizQuestionTranslationEntity,
    (translation) => translation.question,
    {
      cascade: true,
    },
  )
  translations: QuizQuestionTranslationEntity[];
}
