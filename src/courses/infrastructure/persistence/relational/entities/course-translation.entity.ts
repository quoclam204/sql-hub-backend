import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CourseEntity } from './course.entity';

@Entity({
  name: 'course_translation',
})
@Index(['course', 'locale'], { unique: true })
export class CourseTranslationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CourseEntity, (course) => course.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ type: String, length: 10, default: 'vi' })
  locale: string;

  @Column({ type: String })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
