import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { LessonEntity } from './lesson.entity';

@Entity({
  name: 'lesson_translation',
})
@Index(['lesson', 'locale'], { unique: true })
export class LessonTranslationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson: LessonEntity;

  @Column({ name: 'lesson_id' })
  lessonId: number;

  @Column({ type: String, length: 10, default: 'vi' })
  locale: string;

  @Column({ type: String })
  title: string;

  @Column({ type: 'text', name: 'content_md' })
  contentMd: string;
}
