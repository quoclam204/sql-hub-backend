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
