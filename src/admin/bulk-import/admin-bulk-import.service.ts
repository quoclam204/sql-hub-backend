import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { LessonEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson.entity';
import { LessonTranslationEntity } from '../../lessons/infrastructure/persistence/relational/entities/lesson-translation.entity';
import { CourseEntity } from '../../courses/infrastructure/persistence/relational/entities/course.entity';
import { QuizEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz.entity';
import { QuizQuestionEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-question.entity';
import { QuestionOptionEntity } from '../../quizzes/infrastructure/persistence/relational/entities/question-option.entity';
import { QuizQuestionTranslationEntity } from '../../quizzes/infrastructure/persistence/relational/entities/quiz-question-translation.entity';
import { LabEntity } from '../../labs/infrastructure/persistence/relational/entities/lab.entity';
import { LabTranslationEntity } from '../../labs/infrastructure/persistence/relational/entities/lab-translation.entity';
import { DatasetEntity } from '../../labs/infrastructure/persistence/relational/entities/dataset.entity';
import {
  BulkImportRequestDto,
  BulkImportTypeEnum,
  BulkImportFormatEnum,
  BulkImportErrorItem,
  BulkImportResponseDto,
} from './dto/bulk-import.dto';

interface RawParsedLesson {
  courseId?: number;
  courseSlug?: string;
  slug: string;
  order?: number;
  titleVi?: string;
  contentVi?: string;
  titleEn?: string;
  contentEn?: string;
}

interface RawParsedQuizOption {
  optionTextVi: string;
  optionTextEn?: string;
  isCorrect: boolean;
  order?: number;
}

interface RawParsedQuizQuestion {
  quizId?: number;
  order?: number;
  questionTextVi: string;
  explanationVi?: string;
  questionTextEn: string;
  explanationEn?: string;
  options: RawParsedQuizOption[];
}

interface RawParsedLab {
  datasetId?: number;
  datasetName?: string;
  lessonId?: number;
  lessonSlug?: string;
  expectedQuery: string;
  orderSensitive?: boolean;
  titleVi: string;
  descriptionVi?: string;
  hintVi?: string;
  titleEn: string;
  descriptionEn?: string;
  hintEn?: string;
}

@Injectable()
export class AdminBulkImportService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(LessonEntity)
    private readonly lessonRepo: Repository<LessonEntity>,
    @InjectRepository(LessonTranslationEntity)
    private readonly lessonTranslationRepo: Repository<LessonTranslationEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    @InjectRepository(QuizEntity)
    private readonly quizRepo: Repository<QuizEntity>,
    @InjectRepository(QuizQuestionEntity)
    private readonly questionRepo: Repository<QuizQuestionEntity>,
    @InjectRepository(QuestionOptionEntity)
    private readonly optionRepo: Repository<QuestionOptionEntity>,
    @InjectRepository(QuizQuestionTranslationEntity)
    private readonly questionTranslationRepo: Repository<QuizQuestionTranslationEntity>,
    @InjectRepository(LabEntity)
    private readonly labRepo: Repository<LabEntity>,
    @InjectRepository(LabTranslationEntity)
    private readonly labTranslationRepo: Repository<LabTranslationEntity>,
    @InjectRepository(DatasetEntity)
    private readonly datasetRepo: Repository<DatasetEntity>,
  ) {}

  /**
   * Main entry point for bulk import operations.
   */
  async execute(dto: BulkImportRequestDto): Promise<BulkImportResponseDto> {
    const dryRun = Boolean(dto.dryRun);

    // 1. Parsing Phase
    const { items, errors: parseErrors } = this.parseContent(
      dto.type,
      dto.format,
      dto.content,
    );

    if (parseErrors.length > 0) {
      if (!dryRun) {
        throw new BadRequestException({
          message: 'Bulk import parsing failed',
          errors: parseErrors,
        });
      }
      return {
        success: false,
        type: dto.type,
        dryRun,
        totalCount: items.length,
        importedCount: 0,
        errors: parseErrors,
        preview: [],
      };
    }

    if (items.length === 0) {
      const emptyError: BulkImportErrorItem = {
        index: 1,
        message: 'No valid records found in the provided content',
      };
      if (!dryRun) {
        throw new BadRequestException({
          message: 'Bulk import contains no records',
          errors: [emptyError],
        });
      }
      return {
        success: false,
        type: dto.type,
        dryRun,
        totalCount: 0,
        importedCount: 0,
        errors: [emptyError],
        preview: [],
      };
    }

    // 2. Validation Phase
    let validationErrors: BulkImportErrorItem[] = [];
    if (dto.type === BulkImportTypeEnum.LESSONS) {
      validationErrors = await this.validateLessons(items as RawParsedLesson[]);
    } else if (dto.type === BulkImportTypeEnum.QUIZ_QUESTIONS) {
      validationErrors = await this.validateQuizQuestions(
        items as RawParsedQuizQuestion[],
      );
    } else if (dto.type === BulkImportTypeEnum.LABS) {
      validationErrors = await this.validateLabs(items as RawParsedLab[]);
    }

    if (validationErrors.length > 0) {
      if (!dryRun) {
        throw new BadRequestException({
          message: 'Validation failed for bulk import',
          errors: validationErrors,
        });
      }
      return {
        success: false,
        type: dto.type,
        dryRun,
        totalCount: items.length,
        importedCount: 0,
        errors: validationErrors,
        preview: items,
      };
    }

    // If dryRun is true and validation succeeded:
    if (dryRun) {
      return {
        success: true,
        type: dto.type,
        dryRun: true,
        totalCount: items.length,
        importedCount: 0,
        errors: [],
        preview: items,
      };
    }

    // 3. Execution Phase (Transactional all-or-nothing)
    return await this.dataSource.transaction(async (manager) => {
      if (dto.type === BulkImportTypeEnum.LESSONS) {
        await this.persistLessons(items as RawParsedLesson[], manager);
      } else if (dto.type === BulkImportTypeEnum.QUIZ_QUESTIONS) {
        await this.persistQuizQuestions(
          items as RawParsedQuizQuestion[],
          manager,
        );
      } else if (dto.type === BulkImportTypeEnum.LABS) {
        await this.persistLabs(items as RawParsedLab[], manager);
      }

      return {
        success: true,
        type: dto.type,
        dryRun: false,
        totalCount: items.length,
        importedCount: items.length,
        errors: [],
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Parsing Helpers
  // ─────────────────────────────────────────────────────────────

  private parseContent(
    type: BulkImportTypeEnum,
    format: BulkImportFormatEnum,
    rawContent: string,
  ): { items: any[]; errors: BulkImportErrorItem[] } {
    const trimmed = (rawContent || '').trim();
    if (!trimmed) {
      return {
        items: [],
        errors: [{ index: 1, message: 'Content cannot be empty' }],
      };
    }

    if (format === BulkImportFormatEnum.JSON) {
      try {
        const parsed = JSON.parse(trimmed);
        let items: any[] = [];
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && typeof parsed === 'object') {
          // Check common wrapper keys
          items =
            parsed.lessons ||
            parsed.quizQuestions ||
            parsed.questions ||
            parsed.labs ||
            parsed.items ||
            [parsed];
        }

        if (!Array.isArray(items)) {
          return {
            items: [],
            errors: [
              {
                index: 1,
                message:
                  'JSON root must be an array of records or an object with an items array',
              },
            ],
          };
        }

        return { items, errors: [] };
      } catch (err: any) {
        return {
          items: [],
          errors: [
            {
              index: 1,
              message: `Invalid JSON syntax: ${err.message || 'Check commas and quotes'}`,
            },
          ],
        };
      }
    }

    // Markdown parsing
    if (format === BulkImportFormatEnum.MARKDOWN) {
      try {
        if (type === BulkImportTypeEnum.LESSONS) {
          return this.parseMarkdownLessons(trimmed);
        } else if (type === BulkImportTypeEnum.QUIZ_QUESTIONS) {
          return this.parseMarkdownQuizQuestions(trimmed);
        } else if (type === BulkImportTypeEnum.LABS) {
          return this.parseMarkdownLabs(trimmed);
        }
      } catch (err: any) {
        return {
          items: [],
          errors: [
            {
              index: 1,
              message: `Markdown parsing error: ${err.message}`,
            },
          ],
        };
      }
    }

    return {
      items: [],
      errors: [{ index: 1, message: `Unsupported format: ${format}` }],
    };
  }

  /**
   * Parses Markdown documents for Lessons.
   * Supports delimiter `===` or `---lesson---` or `---` frontmatter blocks.
   */
  private parseMarkdownLessons(content: string): {
    items: RawParsedLesson[];
    errors: BulkImportErrorItem[];
  } {
    const rawDocs = content
      .split(/\n(?:===+|---lesson---)\n?/gi)
      .map((d) => d.trim())
      .filter(Boolean);

    const docs = rawDocs.length > 0 ? rawDocs : [content];
    const items: RawParsedLesson[] = [];
    const errors: BulkImportErrorItem[] = [];

    docs.forEach((doc, idx) => {
      const index = idx + 1;
      const frontmatterMatch = doc.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      let meta: Record<string, string> = {};
      let body = doc;

      if (frontmatterMatch) {
        const rawMeta = frontmatterMatch[1];
        body = frontmatterMatch[2] || '';
        meta = this.parseSimpleYaml(rawMeta);
      }

      // Extract bilingual content sections if present
      let contentVi = body;
      let contentEn = body;

      const viMatch = body.match(/#+\s*(?:vi|tiếng việt|vietnamese)\b\r?\n([\s\S]*?)(?=#+\s*(?:en|tiếng anh|english)|$)/i);
      const enMatch = body.match(/#+\s*(?:en|tiếng anh|english)\b\r?\n([\s\S]*?)(?=#+\s*(?:vi|tiếng việt|vietnamese)|$)/i);

      if (viMatch) contentVi = viMatch[1].trim();
      if (enMatch) contentEn = enMatch[1].trim();

      const slug = meta.slug || meta.Slug;
      if (!slug) {
        errors.push({
          index,
          field: 'slug',
          message: 'Missing "slug" in Markdown frontmatter',
        });
        return;
      }

      items.push({
        courseId: meta.courseId ? Number(meta.courseId) : undefined,
        courseSlug: meta.courseSlug,
        slug: slug.trim(),
        order: meta.order ? Number(meta.order) : index,
        titleVi: meta.titleVi || meta.title || slug,
        titleEn: meta.titleEn || meta.title || slug,
        contentVi: contentVi.trim(),
        contentEn: contentEn.trim(),
      });
    });

    return { items, errors };
  }

  /**
   * Parses Markdown documents for Quiz Questions.
   * Recognizes:
   * ## Quiz: 1
   * ### Question Vi: ...
   * ### Question En: ...
   * - [x] Option 1
   * - [ ] Option 2
   */
  private parseMarkdownQuizQuestions(content: string): {
    items: RawParsedQuizQuestion[];
    errors: BulkImportErrorItem[];
  } {
    const rawBlocks = content
      .split(/\n(?:===+|---question---)\n?/gi)
      .map((b) => b.trim())
      .filter(Boolean);

    const blocks = rawBlocks.length > 0 ? rawBlocks : [content];
    const items: RawParsedQuizQuestion[] = [];
    const errors: BulkImportErrorItem[] = [];

    blocks.forEach((block, idx) => {
      const index = idx + 1;
      const lines = block.split(/\r?\n/);
      let quizId: number | undefined;
      let order = index;
      let questionTextVi = '';
      let questionTextEn = '';
      let explanationVi = '';
      let explanationEn = '';
      const options: RawParsedQuizOption[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (/^quiz(?:id)?:\s*(\d+)/i.test(trimmed)) {
          const m = trimmed.match(/^quiz(?:id)?:\s*(\d+)/i);
          if (m) quizId = Number(m[1]);
        } else if (/^order:\s*(\d+)/i.test(trimmed)) {
          const m = trimmed.match(/^order:\s*(\d+)/i);
          if (m) order = Number(m[1]);
        } else if (/^#*\s*(?:question|câu hỏi)(?:\s*vi)?:\s*(.*)/i.test(trimmed)) {
          const m = trimmed.match(/^#*\s*(?:question|câu hỏi)(?:\s*vi)?:\s*(.*)/i);
          if (m) questionTextVi = m[1].trim();
        } else if (/^#*\s*(?:question|câu hỏi)\s*en:\s*(.*)/i.test(trimmed)) {
          const m = trimmed.match(/^#*\s*(?:question|câu hỏi)\s*en:\s*(.*)/i);
          if (m) questionTextEn = m[1].trim();
        } else if (/^explanation(?:\s*vi)?:\s*(.*)/i.test(trimmed)) {
          const m = trimmed.match(/^explanation(?:\s*vi)?:\s*(.*)/i);
          if (m) explanationVi = m[1].trim();
        } else if (/^explanation\s*en:\s*(.*)/i.test(trimmed)) {
          const m = trimmed.match(/^explanation\s*en:\s*(.*)/i);
          if (m) explanationEn = m[1].trim();
        } else if (/^-\s*\[([ xX])\]\s*(.*)/.test(trimmed)) {
          const m = trimmed.match(/^-\s*\[([ xX])\]\s*(.*)/);
          if (m) {
            const isCorrect = m[1].toLowerCase() === 'x';
            const optRaw = m[2].trim();
            // Optional bilingual separator " | "
            const optParts = optRaw.split('|').map((s) => s.trim());
            options.push({
              optionTextVi: optParts[0],
              optionTextEn: optParts[1] || optParts[0],
              isCorrect,
              order: options.length + 1,
            });
          }
        }
      }

      if (!questionTextEn && questionTextVi) questionTextEn = questionTextVi;
      if (!questionTextVi && questionTextEn) questionTextVi = questionTextEn;

      items.push({
        quizId,
        order,
        questionTextVi,
        explanationVi,
        questionTextEn,
        explanationEn,
        options,
      });
    });

    return { items, errors };
  }

  /**
   * Parses Markdown documents for SQL Labs.
   */
  private parseMarkdownLabs(content: string): {
    items: RawParsedLab[];
    errors: BulkImportErrorItem[];
  } {
    const rawDocs = content
      .split(/\n(?:===+|---lab---)\n?/gi)
      .map((d) => d.trim())
      .filter(Boolean);

    const docs = rawDocs.length > 0 ? rawDocs : [content];
    const items: RawParsedLab[] = [];
    const errors: BulkImportErrorItem[] = [];

    docs.forEach((doc, idx) => {
      const index = idx + 1;
      const frontmatterMatch = doc.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      let meta: Record<string, string> = {};
      let body = doc;

      if (frontmatterMatch) {
        meta = this.parseSimpleYaml(frontmatterMatch[1]);
        body = frontmatterMatch[2] || '';
      }

      // Expected query from code block ```sql ... ```
      let expectedQuery = meta.expectedQuery || '';
      const sqlBlockMatch = body.match(/```(?:sql)?\r?\n([\s\S]*?)\r?\n```/i);
      if (sqlBlockMatch) {
        expectedQuery = sqlBlockMatch[1].trim();
      }

      // Extract descriptions and hints
      const descViMatch = body.match(/#+\s*(?:description|mô tả|yêu cầu)(?:\s*vi)?\b\r?\n([\s\S]*?)(?=#+|$)/i);
      const descEnMatch = body.match(/#+\s*(?:description|mô tả)\s*en\b\r?\n([\s\S]*?)(?=#+|$)/i);
      const hintViMatch = body.match(/#+\s*(?:hint|gợi ý)(?:\s*vi)?\b\r?\n([\s\S]*?)(?=#+|$)/i);
      const hintEnMatch = body.match(/#+\s*(?:hint|gợi ý)\s*en\b\r?\n([\s\S]*?)(?=#+|$)/i);

      items.push({
        datasetId: meta.datasetId ? Number(meta.datasetId) : undefined,
        datasetName: meta.datasetName,
        lessonId: meta.lessonId ? Number(meta.lessonId) : undefined,
        lessonSlug: meta.lessonSlug,
        expectedQuery: expectedQuery.trim(),
        orderSensitive:
          meta.orderSensitive === 'true' || meta.orderSensitive === '1',
        titleVi: meta.titleVi || meta.title || `Lab #${index}`,
        titleEn: meta.titleEn || meta.title || `Lab #${index}`,
        descriptionVi: descViMatch ? descViMatch[1].trim() : meta.descriptionVi,
        descriptionEn: descEnMatch ? descEnMatch[1].trim() : meta.descriptionEn,
        hintVi: hintViMatch ? hintViMatch[1].trim() : meta.hintVi,
        hintEn: hintEnMatch ? hintEnMatch[1].trim() : meta.hintEn,
      });
    });

    return { items, errors };
  }

  private parseSimpleYaml(raw: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        // strip surrounding quotes if present
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        result[key] = val;
      }
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Relational & Business Validation
  // ─────────────────────────────────────────────────────────────

  private async validateLessons(
    items: RawParsedLesson[],
  ): Promise<BulkImportErrorItem[]> {
    const errors: BulkImportErrorItem[] = [];
    const seenSlugsInBatch = new Set<string>();

    // Pre-fetch courses for verification
    const allCourses = await this.courseRepo.find();
    const courseIdSet = new Set(allCourses.map((c) => c.id));
    const courseSlugMap = new Map(allCourses.map((c) => [c.slug, c.id]));

    // Pre-fetch existing slugs in DB for batch
    const candidateSlugs = items.map((i) => i.slug).filter(Boolean);
    const existingLessons = candidateSlugs.length > 0
      ? await this.lessonRepo.find({ where: { slug: In(candidateSlugs) } })
      : [];
    const existingSlugSet = new Set(existingLessons.map((l) => l.slug));

    items.forEach((item, idx) => {
      const index = idx + 1;

      // 1. Slug check
      if (!item.slug || !item.slug.trim()) {
        errors.push({
          index,
          field: 'slug',
          message: 'Lesson slug is required and cannot be empty',
        });
      } else {
        const slug = item.slug.trim();
        if (seenSlugsInBatch.has(slug)) {
          errors.push({
            index,
            identifier: slug,
            field: 'slug',
            message: `Duplicate slug "${slug}" detected within the same import batch`,
          });
        }
        seenSlugsInBatch.add(slug);

        if (existingSlugSet.has(slug)) {
          errors.push({
            index,
            identifier: slug,
            field: 'slug',
            message: `Lesson with slug "${slug}" already exists in the database`,
          });
        }
      }

      // 2. Course relation check
      let resolvedCourseId = item.courseId;
      if (!resolvedCourseId && item.courseSlug) {
        resolvedCourseId = courseSlugMap.get(item.courseSlug);
      }

      if (!resolvedCourseId) {
        errors.push({
          index,
          identifier: item.slug,
          field: 'courseId',
          message:
            item.courseSlug
              ? `Course with slug "${item.courseSlug}" not found`
              : 'Missing valid courseId or courseSlug',
        });
      } else if (!courseIdSet.has(resolvedCourseId)) {
        errors.push({
          index,
          identifier: item.slug,
          field: 'courseId',
          message: `Course with ID ${resolvedCourseId} does not exist`,
        });
      } else {
        item.courseId = resolvedCourseId;
      }

      // 3. Title check
      if (!item.titleVi?.trim() && !item.titleEn?.trim()) {
        errors.push({
          index,
          identifier: item.slug,
          field: 'titleVi',
          message: 'At least one title (titleVi or titleEn) must be provided',
        });
      }
    });

    return errors;
  }

  private async validateQuizQuestions(
    items: RawParsedQuizQuestion[],
  ): Promise<BulkImportErrorItem[]> {
    const errors: BulkImportErrorItem[] = [];

    // Pre-fetch all quiz IDs
    const allQuizzes = await this.quizRepo.find();
    const quizIdSet = new Set(allQuizzes.map((q) => q.id));

    items.forEach((item, idx) => {
      const index = idx + 1;
      const snippet = item.questionTextVi || item.questionTextEn || `Question #${index}`;

      // 1. Quiz ID check
      if (!item.quizId) {
        errors.push({
          index,
          identifier: snippet,
          field: 'quizId',
          message: 'quizId is required for quiz question',
        });
      } else if (!quizIdSet.has(item.quizId)) {
        errors.push({
          index,
          identifier: snippet,
          field: 'quizId',
          message: `Quiz with ID ${item.quizId} does not exist`,
        });
      }

      // 2. Question text check
      if (!item.questionTextVi?.trim()) {
        errors.push({
          index,
          identifier: snippet,
          field: 'questionTextVi',
          message: 'questionTextVi is required and cannot be empty',
        });
      }
      if (!item.questionTextEn?.trim()) {
        errors.push({
          index,
          identifier: snippet,
          field: 'questionTextEn',
          message: 'questionTextEn is required and cannot be empty',
        });
      }

      // 3. Options validation
      if (!item.options || !Array.isArray(item.options) || item.options.length < 2) {
        errors.push({
          index,
          identifier: snippet,
          field: 'options',
          message: 'A quiz question must have at least 2 options',
        });
      } else {
        const correctCount = item.options.filter((o) => o.isCorrect).length;
        if (correctCount !== 1) {
          errors.push({
            index,
            identifier: snippet,
            field: 'options',
            message: `A quiz question must have exactly one correct option (found ${correctCount})`,
          });
        }

        item.options.forEach((opt, optIdx) => {
          if (!opt.optionTextVi?.trim()) {
            errors.push({
              index,
              identifier: snippet,
              field: `options[${optIdx}].optionTextVi`,
              message: `Option ${optIdx + 1} has empty text`,
            });
          }
        });
      }
    });

    return errors;
  }

  private async validateLabs(items: RawParsedLab[]): Promise<BulkImportErrorItem[]> {
    const errors: BulkImportErrorItem[] = [];

    // Pre-fetch datasets
    const allDatasets = await this.datasetRepo.find();
    const datasetIdSet = new Set(allDatasets.map((d) => d.id));
    const datasetNameMap = new Map(allDatasets.map((d) => [d.name, d.id]));

    // Pre-fetch lessons
    const allLessons = await this.lessonRepo.find();
    const lessonIdSet = new Set(allLessons.map((l) => l.id));
    const lessonSlugMap = new Map(allLessons.map((l) => [l.slug, l.id]));

    items.forEach((item, idx) => {
      const index = idx + 1;
      const title = item.titleVi || item.titleEn || `Lab #${index}`;

      // 1. Dataset check
      let resolvedDatasetId = item.datasetId;
      if (!resolvedDatasetId && item.datasetName) {
        resolvedDatasetId = datasetNameMap.get(item.datasetName);
      }

      if (!resolvedDatasetId) {
        errors.push({
          index,
          identifier: title,
          field: 'datasetId',
          message: item.datasetName
            ? `Dataset with name "${item.datasetName}" not found`
            : 'Missing valid datasetId or datasetName',
        });
      } else if (!datasetIdSet.has(resolvedDatasetId)) {
        errors.push({
          index,
          identifier: title,
          field: 'datasetId',
          message: `Dataset with ID ${resolvedDatasetId} does not exist`,
        });
      } else {
        item.datasetId = resolvedDatasetId;
      }

      // 2. Optional lesson check
      if (item.lessonSlug && !item.lessonId) {
        item.lessonId = lessonSlugMap.get(item.lessonSlug);
        if (!item.lessonId) {
          errors.push({
            index,
            identifier: title,
            field: 'lessonSlug',
            message: `Lesson with slug "${item.lessonSlug}" not found`,
          });
        }
      } else if (item.lessonId && !lessonIdSet.has(item.lessonId)) {
        errors.push({
          index,
          identifier: title,
          field: 'lessonId',
          message: `Lesson with ID ${item.lessonId} does not exist`,
        });
      }

      // 3. Expected Query check (NFR-02 Sandbox Safety)
      if (!item.expectedQuery || !item.expectedQuery.trim()) {
        errors.push({
          index,
          identifier: title,
          field: 'expectedQuery',
          message: 'expectedQuery is required and cannot be empty',
        });
      } else {
        const normalized = item.expectedQuery.trim().toUpperCase();
        if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
          errors.push({
            index,
            identifier: title,
            field: 'expectedQuery',
            message:
              'Security constraint: expectedQuery must be a read query (starting with SELECT or WITH)',
          });
        }
      }

      // 4. Title check
      if (!item.titleVi?.trim()) {
        errors.push({
          index,
          identifier: title,
          field: 'titleVi',
          message: 'titleVi is required for lab',
        });
      }
      if (!item.titleEn?.trim()) {
        errors.push({
          index,
          identifier: title,
          field: 'titleEn',
          message: 'titleEn is required for lab',
        });
      }
    });

    return errors;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Transactional Persistence
  // ─────────────────────────────────────────────────────────────

  private async persistLessons(
    items: RawParsedLesson[],
    manager: any,
  ): Promise<void> {
    for (const item of items) {
      const lesson = manager.create(LessonEntity, {
        courseId: item.courseId,
        slug: item.slug.trim(),
        order: item.order ?? 1,
      });
      const savedLesson = await manager.save(LessonEntity, lesson);

      const translations: LessonTranslationEntity[] = [
        manager.create(LessonTranslationEntity, {
          lessonId: savedLesson.id,
          locale: 'vi',
          title: item.titleVi || item.slug,
          contentMd: item.contentVi || '',
        }),
        manager.create(LessonTranslationEntity, {
          lessonId: savedLesson.id,
          locale: 'en',
          title: item.titleEn || item.slug,
          contentMd: item.contentEn || '',
        }),
      ];
      await manager.save(LessonTranslationEntity, translations);
    }
  }

  private async persistQuizQuestions(
    items: RawParsedQuizQuestion[],
    manager: any,
  ): Promise<void> {
    for (const item of items) {
      const question = manager.create(QuizQuestionEntity, {
        quizId: item.quizId,
        order: item.order ?? 1,
        questionText: item.questionTextVi,
        explanation: item.explanationVi || null,
      });
      const savedQuestion = await manager.save(QuizQuestionEntity, question);

      // Bilingual translations
      const translations = [
        manager.create(QuizQuestionTranslationEntity, {
          questionId: savedQuestion.id,
          locale: 'vi',
          questionText: item.questionTextVi,
          explanation: item.explanationVi || null,
        }),
        manager.create(QuizQuestionTranslationEntity, {
          questionId: savedQuestion.id,
          locale: 'en',
          questionText: item.questionTextEn,
          explanation: item.explanationEn || null,
        }),
      ];
      await manager.save(QuizQuestionTranslationEntity, translations);

      // Options
      const optionsToSave = item.options.map((opt, optIdx) =>
        manager.create(QuestionOptionEntity, {
          questionId: savedQuestion.id,
          optionText: opt.optionTextVi,
          optionTextEn: opt.optionTextEn || opt.optionTextVi,
          isCorrect: opt.isCorrect,
          order: opt.order ?? optIdx + 1,
        }),
      );
      await manager.save(QuestionOptionEntity, optionsToSave);
    }
  }

  private async persistLabs(
    items: RawParsedLab[],
    manager: any,
  ): Promise<void> {
    for (const item of items) {
      const lab = manager.create(LabEntity, {
        datasetId: item.datasetId,
        lessonId: item.lessonId || null,
        expectedQuery: item.expectedQuery.trim(),
        orderSensitive: Boolean(item.orderSensitive),
      });
      const savedLab = await manager.save(LabEntity, lab);

      // Bilingual translations
      const translations = [
        manager.create(LabTranslationEntity, {
          labId: savedLab.id,
          locale: 'vi',
          title: item.titleVi,
          description: item.descriptionVi || null,
          hint: item.hintVi || null,
        }),
        manager.create(LabTranslationEntity, {
          labId: savedLab.id,
          locale: 'en',
          title: item.titleEn,
          description: item.descriptionEn || null,
          hint: item.hintEn || null,
        }),
      ];
      await manager.save(LabTranslationEntity, translations);
    }
  }

  /**
   * Helper to provide sample templates for Admin UI downloads/examples.
   */
  getSampleTemplates() {
    return {
      lessons: {
        json: JSON.stringify(
          [
            {
              courseId: 1,
              slug: 'menh-de-select-co-ban',
              order: 1,
              titleVi: 'Mệnh đề SELECT cơ bản',
              titleEn: 'Basic SELECT Statement',
              contentVi: '# Mệnh đề SELECT trong SQL\n\nSELECT column1, column2 FROM table_name;',
              contentEn: '# The SELECT statement in SQL\n\nSELECT column1, column2 FROM table_name;',
            },
            {
              courseId: 1,
              slug: 'menh-de-where-loc-du-lieu',
              order: 2,
              titleVi: 'Mệnh đề WHERE lọc dữ liệu',
              titleEn: 'WHERE Clause for Filtering',
              contentVi: '# Mệnh đề WHERE\n\nSELECT * FROM employees WHERE department = "IT";',
              contentEn: '# The WHERE Clause\n\nSELECT * FROM employees WHERE department = "IT";',
            },
          ],
          null,
          2,
        ),
        markdown: `---
courseId: 1
slug: menh-de-select-co-ban
order: 1
titleVi: Mệnh đề SELECT cơ bản
titleEn: Basic SELECT Statement
---
# vi
# Mệnh đề SELECT trong SQL

Cú pháp truy vấn cơ bản:
\`\`\`sql
SELECT column1, column2 FROM table_name;
\`\`\`

# en
# The SELECT statement in SQL

Basic query syntax:
\`\`\`sql
SELECT column1, column2 FROM table_name;
\`\`\`
===
---
courseId: 1
slug: menh-de-where-loc-du-lieu
order: 2
titleVi: Mệnh đề WHERE lọc dữ liệu
titleEn: WHERE Clause for Filtering
---
# vi
# Lọc dữ liệu với WHERE

Cú pháp:
\`\`\`sql
SELECT * FROM employees WHERE department = 'IT';
\`\`\`

# en
# Filtering Data with WHERE

Syntax:
\`\`\`sql
SELECT * FROM employees WHERE department = 'IT';
\`\`\``,
      },
      quizQuestions: {
        json: JSON.stringify(
          [
            {
              quizId: 1,
              order: 1,
              questionTextVi: 'Từ khóa nào trong SQL được dùng để lấy dữ liệu từ một bảng?',
              explanationVi: 'SELECT là từ khóa tiêu chuẩn trong SQL để truy xuất dữ liệu từ một hoặc nhiều bảng.',
              questionTextEn: 'Which SQL keyword is used to retrieve data from a database table?',
              explanationEn: 'SELECT is the standard SQL keyword used to query data from tables.',
              options: [
                {
                  optionTextVi: 'SELECT',
                  optionTextEn: 'SELECT',
                  isCorrect: true,
                  order: 1,
                },
                {
                  optionTextVi: 'GET',
                  optionTextEn: 'GET',
                  isCorrect: false,
                  order: 2,
                },
                {
                  optionTextVi: 'EXTRACT',
                  optionTextEn: 'EXTRACT',
                  isCorrect: false,
                  order: 3,
                },
                {
                  optionTextVi: 'QUERY',
                  optionTextEn: 'QUERY',
                  isCorrect: false,
                  order: 4,
                },
              ],
            },
          ],
          null,
          2,
        ),
        markdown: `Quiz: 1
Order: 1
Question Vi: Từ khóa nào trong SQL được dùng để lấy dữ liệu từ một bảng?
Question En: Which SQL keyword is used to retrieve data from a database table?
Explanation Vi: SELECT là từ khóa tiêu chuẩn trong SQL để truy xuất dữ liệu.
Explanation En: SELECT is the standard SQL keyword used to query data.
- [x] SELECT | SELECT
- [ ] GET | GET
- [ ] EXTRACT | EXTRACT
- [ ] QUERY | QUERY`,
      },
      labs: {
        json: JSON.stringify(
          [
            {
              datasetId: 1,
              lessonId: 1,
              expectedQuery: 'SELECT id, full_name, salary FROM employees WHERE salary >= 50000 ORDER BY salary DESC;',
              orderSensitive: true,
              titleVi: 'Bài tập 1: Lọc nhân viên có mức lương cao',
              titleEn: 'Lab 1: Filter High Salary Employees',
              descriptionVi: 'Viết câu truy vấn lấy danh sách các cột id, full_name, salary từ bảng employees với mức lương từ 50,000 trở lên, sắp xếp giảm dần theo salary.',
              descriptionEn: 'Write a query to retrieve id, full_name, salary from employees with salary >= 50000, ordered by salary descending.',
              hintVi: 'Sử dụng WHERE salary >= 50000 kết hợp ORDER BY salary DESC.',
              hintEn: 'Use WHERE salary >= 50000 combined with ORDER BY salary DESC.',
            },
          ],
          null,
          2,
        ),
        markdown: `---
datasetId: 1
lessonId: 1
orderSensitive: true
titleVi: Bài tập 1: Lọc nhân viên có mức lương cao
titleEn: Lab 1: Filter High Salary Employees
---
### Description Vi
Viết câu truy vấn lấy danh sách các cột id, full_name, salary từ bảng employees với mức lương từ 50,000 trở lên, sắp xếp giảm dần theo salary.

### Description En
Write a query to retrieve id, full_name, salary from employees with salary >= 50000, ordered by salary descending.

### Expected Query
\`\`\`sql
SELECT id, full_name, salary FROM employees WHERE salary >= 50000 ORDER BY salary DESC;
\`\`\`

### Hint Vi
Sử dụng WHERE salary >= 50000 kết hợp ORDER BY salary DESC.

### Hint En
Use WHERE salary >= 50000 combined with ORDER BY salary DESC.`,
      },
    };
  }
}
