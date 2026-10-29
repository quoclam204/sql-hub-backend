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
