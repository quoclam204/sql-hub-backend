import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { LabEntity } from './lab.entity';

@Entity({
  name: 'lab_translation',
})
@Index(['lab', 'locale'], { unique: true })
export class LabTranslationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LabEntity, (lab) => lab.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lab_id' })
  lab: LabEntity;

  @Column({ name: 'lab_id' })
  labId: number;

  @Column({ type: String, length: 10, default: 'vi' })
  locale: string;

  @Column({ type: String })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  hint?: string;
}
