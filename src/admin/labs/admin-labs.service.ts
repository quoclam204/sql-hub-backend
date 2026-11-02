import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabEntity } from '../../labs/infrastructure/persistence/relational/entities/lab.entity';
import { DatasetEntity } from '../../labs/infrastructure/persistence/relational/entities/dataset.entity';
import { LabTranslationEntity } from '../../labs/infrastructure/persistence/relational/entities/lab-translation.entity';
import { LabSubmissionEntity } from '../../labs/infrastructure/persistence/relational/entities/lab-submission.entity';
import { LessonEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

@Injectable()
export class AdminLabsService {
  constructor(
    @InjectRepository(LabEntity)
    private readonly labRepo: Repository<LabEntity>,
    @InjectRepository(DatasetEntity)
    private readonly datasetRepo: Repository<DatasetEntity>,
    @InjectRepository(LabTranslationEntity)
    private readonly translationRepo: Repository<LabTranslationEntity>,
    @InjectRepository(LabSubmissionEntity)
    private readonly submissionRepo: Repository<LabSubmissionEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonRepo: Repository<LessonEntity>,
  ) {}

  async findAllDatasets() {
    const datasets = await this.datasetRepo.find({
      order: { id: 'ASC' },
    });
    return datasets.map((d) => ({
      id: d.id,
      name: d.name,
    }));
  }

  async findAll(lessonId?: number) {
    const query = this.labRepo
      .createQueryBuilder('lab')
      .leftJoinAndSelect('lab.dataset', 'dataset')
      .leftJoinAndSelect('lab.lesson', 'lesson')
      .leftJoinAndSelect('lab.translations', 'translation')
      .orderBy('lab.id', 'ASC');

    if (lessonId) {
      query.where('lab.lessonId = :lessonId', { lessonId });
    }

    const labs = await query.getMany();

    return labs.map((l) => {
      const vi = l.translations?.find((t) => t.locale === 'vi');
      const en = l.translations?.find((t) => t.locale === 'en');
      return {
        id: l.id,
        datasetId: l.datasetId,
        datasetName: l.dataset?.name,
        lessonId: l.lessonId,
        lessonSlug: l.lesson?.slug,
        expectedQuery: l.expectedQuery,
        orderSensitive: l.orderSensitive,
        titleVi: vi?.title || '',
        descriptionVi: vi?.description || '',
        hintVi: vi?.hint || '',
        titleEn: en?.title || '',
        descriptionEn: en?.description || '',
        hintEn: en?.hint || '',
        translations: l.translations || [],
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      };
    });
  }

  async findOne(id: number) {
    const lab = await this.labRepo.findOne({
      where: { id: Number(id) },
      relations: ['dataset', 'lesson', 'translations'],
    });

    if (!lab) {
      throw new NotFoundException(`Lab with ID ${id} not found`);
    }

    const vi = lab.translations?.find((t) => t.locale === 'vi');
    const en = lab.translations?.find((t) => t.locale === 'en');

    return {
      id: lab.id,
      datasetId: lab.datasetId,
      datasetName: lab.dataset?.name,
      lessonId: lab.lessonId,
      lessonSlug: lab.lesson?.slug,
      expectedQuery: lab.expectedQuery,
      orderSensitive: lab.orderSensitive,
      titleVi: vi?.title || '',
      descriptionVi: vi?.description || '',
      hintVi: vi?.hint || '',
      titleEn: en?.title || '',
      descriptionEn: en?.description || '',
      hintEn: en?.hint || '',
      translations: lab.translations || [],
      createdAt: lab.createdAt,
      updatedAt: lab.updatedAt,
    };
  }

  async create(dto: CreateLabDto) {
    // 1. Verify dataset exists
    const dataset = await this.datasetRepo.findOne({
      where: { id: dto.datasetId },
    });
    if (!dataset) {
      throw new BadRequestException(
        `Dataset with ID ${dto.datasetId} does not exist`,
      );
    }

    // 2. Verify optional lesson exists
    if (dto.lessonId) {
      const lesson = await this.lessonRepo.findOne({
        where: { id: dto.lessonId },
      });
      if (!lesson) {
        throw new BadRequestException(
          `Lesson with ID ${dto.lessonId} does not exist`,
        );
      }
    }

    // 3. Security: Check expected query is a read query (SELECT)
    const normalizedQuery = dto.expectedQuery.trim().toUpperCase();
    if (!normalizedQuery.startsWith('SELECT') && !normalizedQuery.startsWith('WITH')) {
      throw new BadRequestException(
        'Expected query must be a valid read query (starting with SELECT or WITH)',
      );
    }

    // 4. Create lab
    const lab = this.labRepo.create({
      datasetId: dto.datasetId,
      lessonId: dto.lessonId || null,
      expectedQuery: dto.expectedQuery,
      orderSensitive: dto.orderSensitive ?? false,
    });
    const savedLab = await this.labRepo.save(lab);

    // 5. Create bilingual translations
    const translations = [
      this.translationRepo.create({
        labId: savedLab.id,
        locale: 'vi',
        title: dto.titleVi,
        description: dto.descriptionVi || null,
        hint: dto.hintVi || null,
      }),
      this.translationRepo.create({
        labId: savedLab.id,
        locale: 'en',
        title: dto.titleEn,
        description: dto.descriptionEn || null,
        hint: dto.hintEn || null,
      }),
    ];
    await this.translationRepo.save(translations);

    return this.findOne(savedLab.id);
  }

  async update(id: number, dto: UpdateLabDto) {
    const lab = await this.labRepo.findOne({
      where: { id: Number(id) },
      relations: ['translations'],
    });

    if (!lab) {
      throw new NotFoundException(`Lab with ID ${id} not found`);
    }

    if (dto.datasetId) {
      const dataset = await this.datasetRepo.findOne({
        where: { id: dto.datasetId },
      });
      if (!dataset) {
        throw new BadRequestException(
          `Dataset with ID ${dto.datasetId} does not exist`,
        );
      }
      lab.datasetId = dto.datasetId;
    }

    if (dto.lessonId !== undefined) {
      if (dto.lessonId !== null) {
        const lesson = await this.lessonRepo.findOne({
          where: { id: dto.lessonId },
        });
        if (!lesson) {
          throw new BadRequestException(
            `Lesson with ID ${dto.lessonId} does not exist`,
          );
        }
      }
      lab.lessonId = dto.lessonId || null;
    }

    if (dto.expectedQuery) {
      const normalized = dto.expectedQuery.trim().toUpperCase();
      if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
        throw new BadRequestException(
          'Expected query must be a valid read query (starting with SELECT or WITH)',
        );
      }
      lab.expectedQuery = dto.expectedQuery;
    }

    if (dto.orderSensitive !== undefined) {
      lab.orderSensitive = dto.orderSensitive;
    }

    await this.labRepo.save(lab);

    // Update translations
    const updateLocale = async (
      locale: string,
      title?: string,
      description?: string,
      hint?: string,
    ) => {
      if (
        title === undefined &&
        description === undefined &&
        hint === undefined
      ) {
        return;
      }
      let trans = lab.translations?.find((t) => t.locale === locale);
      if (trans) {
        if (title !== undefined) trans.title = title;
        if (description !== undefined) trans.description = description || null;
        if (hint !== undefined) trans.hint = hint || null;
        await this.translationRepo.save(trans);
      } else if (title !== undefined) {
        trans = this.translationRepo.create({
          labId: lab.id,
          locale,
          title,
          description: description || null,
          hint: hint || null,
        });
        await this.translationRepo.save(trans);
      }
    };

    if (
      dto.titleVi !== undefined ||
      dto.descriptionVi !== undefined ||
      dto.hintVi !== undefined
    ) {
      await updateLocale('vi', dto.titleVi, dto.descriptionVi, dto.hintVi);
    }

    if (
      dto.titleEn !== undefined ||
      dto.descriptionEn !== undefined ||
      dto.hintEn !== undefined
    ) {
      await updateLocale('en', dto.titleEn, dto.descriptionEn, dto.hintEn);
    }

    return this.findOne(lab.id);
  }

  async delete(id: number) {
    const numericId = Number(id);
    const lab = await this.labRepo.findOne({
      where: { id: numericId },
    });

    if (!lab) {
      throw new NotFoundException(`Lab with ID ${id} not found`);
    }

    // Safety guard: prevent accidental deletion if learners already submitted work for this lab
    const submissionCount = await this.submissionRepo.count({
      where: { labId: numericId },
    });

    if (submissionCount > 0) {
      throw new BadRequestException(
        `Cannot delete lab because ${submissionCount} learner submission(s) exist for it. Protects student progress history.`,
      );
    }

    await this.labRepo.remove(lab);

    return { success: true, message: `Lab ${id} successfully deleted` };
  }
}
