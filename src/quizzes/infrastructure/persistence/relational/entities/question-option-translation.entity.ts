import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { QuestionOptionEntity } from './question-option.entity';

@Entity({
  name: 'question_option_translation',
})
@Index(['option', 'locale'], { unique: true })
export class QuestionOptionTranslationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QuestionOptionEntity, (option) => option.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_id' })
  option: QuestionOptionEntity;

  @Column({ name: 'option_id' })
  optionId: number;

  @Column({ type: String, length: 10, default: 'vi' })
  locale: string;

  @Column({ type: String, name: 'option_text' })
  optionText: string;
}
