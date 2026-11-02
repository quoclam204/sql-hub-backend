# AI log - SQL Hub Backend

This file records how AI was used in the project. Every PR must include an
"AI đã giúp gì" section; the lead merges those notes into this file each week.

## Template

```md
## YYYY-MM-DD - <feature / PR title>

- **Requirement**: <FR-XXX or short description>
- **Main prompt**: <the prompt that produced the most useful result>
- **AI generated**: <files, modules, migrations, tests, docs>
- **Human reviewed / changed**: <what a team member verified or fixed>
- **Verification**: <commands run and their result>
```

## Week 1 - Project skeleton and lead scope

### 2026-10-29 - Lead backend foundation

- **Requirement**: SRS-SQLHub v2.2, section 9.1 (Lead) and NFR-07.
- **Main prompt**: "Dựa vào SRS-SQLHub.pdf, code các công việc backend của Lead:
  entity, migration, seed mẫu, GitHub OAuth, i18n, tài liệu kiến trúc và bộ
  khung AI first."
- **AI generated**:
  - Translation entities for quizzes and labs (`quiz_translation`,
    `quiz_question_translation`, `question_option_translation`,
    `lab_translation`).
  - Initial SQLHub schema migration (`1793000000000-CreateSqlHubSchema.ts`)
    covering courses, lessons, progress, quizzes, labs, datasets and
    submissions, plus `user.locale`.
  - Sample lesson seed with `vi`/`en` content for the three courses.
  - Unit tests for `AuthGithubService`.
  - Removal of unused Apple/Facebook auth and MongoDB/Mongoose persistence.
  - Architecture decisions, AI-first commands/skills, secret-scan hook and CI
    workflow.
- **Human reviewed / changed**: _Team member to confirm sandbox option, OAuth
  client credentials and seed content before merging._
- **Verification**: `npm run lint`, `npm test -- --passWithNoTests` (3 tests),
  `npm run build` and `node scripts/check-secrets.js --all` pass. Migrations
  and seeds were executed against a disposable `postgres:17-alpine` container
  (port 55432): 2 migrations ran, 3 courses / 6 course translations / 15
  lessons / 30 lesson translations / 2 users were created. `GET
  /api/v1/courses?locale=vi|en`, `GET /api/v1/courses/sql-co-ban`, email
  login, `GET /auth/me`, logout and refresh-after-logout (401) were checked
  against the running API.
# AI Usage Log (docs/ai-log.md)

## Week 1: 2026-10-29 - Course & Lesson Backend API

- **Task**: Implement Courses, Lessons, Search, and Progress APIs (FR-LESSON-01, FR-LESSON-02, FR-LESSON-03, FR-LESSON-04, FR-I18N-03)
- **Tools used**: Claude Code (Claude Fable 5 / kdb), TypeScript, NestJS, TypeORM, Jest, Supertest
- **Mode**: MODE B (Edit-only mode) — command execution was blocked/timed out in this environment; all changes were implemented via static file editing. No tests, builds, or migrations were run in-session; all commands are NOT RUN pending manual verification by Khang.
- **What the AI generated**:
  - Fix for circular import between `CourseEntity` and `LessonEntity` using TypeORM's `Relation<T>` wrapper type and arrow-function relation targets.
  - TypeORM migration `1761700000000-CreateCoursesAndLessons.ts` (timestamp placeholder 1761700000000) defining `course`, `course_translation`, `lesson` (with `is_preview`), `lesson_translation`, and `lesson_progress` tables with foreign keys and unique constraints.
  - DTOs with Swagger annotations: `QueryLessonDto`, `SearchLessonDto`, `LessonDetailDto`, `LessonSearchResultDto` (with `snippet?: string | null`), `CourseListItemDto`, `CourseDetailDto`, `LessonSummaryDto` (with `completed: boolean`), and `ProgressItemDto`.
  - Service methods in `LessonsService`:
    - `findAllCourses`: calculating `completedCount` per user, returns 0 for guests.
    - `findCourseBySlug`: computing `completed: boolean` per lesson summary for authenticated users (false for guests).
    - `findLessonBySlug`: with `prevSlug`/`nextSlug` and fallback translation returning `translated: boolean`, 403 for guests on non-preview lessons.
    - `searchLessons`: parameter-bound query with `%`/`_`/`\` ILIKE escaping and guest snippet suppression on non-preview lessons.
    - `completeLesson`: idempotent progress recording (returns 204), throws `NotFoundException` (404) for unknown lesson IDs.
    - `getProgress`: returns completed lesson history for authenticated user.
  - Controllers (`CoursesController`, `LessonsController`) with OpenAPI Swagger decorators and dual JWT/Anonymous authentication guards.
  - Data seed in `CourseSeedService` using Markdown + YAML frontmatter format with `// PLACEHOLDER - SQL not yet verified` annotations.
  - Unit tests in `src/lessons/lessons.service.spec.ts` and E2E tests in `test/courses-lessons/courses-lessons.e2e-spec.ts`.
- **What was reviewed and verified by hand**:
  - Code review performed statically in-session.
  - **Commands executed / verified at runtime**: NONE (all tests and commands marked NOT RUN pending verification by Khang).
