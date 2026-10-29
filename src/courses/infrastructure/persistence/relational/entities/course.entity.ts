import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CourseTranslationEntity } from './course-translation.entity';
import { LessonEntity } from '../../../../../lessons/infrastructure/persistence/relational/entities/lesson.entity';

@Entity({
  name: 'course',
})
export class CourseEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: String })
  slug: string;

  @Column({ type: 'int', default: 1 })
  order: number;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @OneToMany(
    () => CourseTranslationEntity,
    (translation) => translation.course,
    {
      cascade: true,
    },
  )
  translations: CourseTranslationEntity[];

  @OneToMany(() => LessonEntity, (lesson) => lesson.course)
  lessons: LessonEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
