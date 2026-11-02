import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CourseEntity } from '../../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { LessonTranslationEntity } from './lesson-translation.entity';

@Entity({
  name: 'lesson',
})
export class LessonEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CourseEntity, (course) => course.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @Column({ name: 'course_id' })
  courseId: number;

  @Index({ unique: true })
  @Column({ type: String })
  slug: string;

  @Column({ type: 'int', default: 1 })
  order: number;

  @OneToMany(
    () => LessonTranslationEntity,
    (translation) => translation.lesson,
    {
      cascade: true,
    },
  )
  translations: LessonTranslationEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
