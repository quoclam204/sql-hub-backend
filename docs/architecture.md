# SQL Hub - Architecture decisions

This document records the architecture decisions for the SQL Hub project
(SRS-SQLHub v2.2). The boilerplate-specific conventions are kept at the end.

---

## 1. System overview

```text
Browser (Next.js, vi/en)
  |  Authorization: Bearer <access token>
  v
NestJS REST API (/api/v1)
  |-- PostgreSQL (TypeORM): users, content, progress, attempts, submissions
  |-- Sandbox: run + grade SQL against a dataset
  |-- Swagger: /docs and /docs-json
```

- Two repositories: `sql-hub-frontend` (Next.js) and `sql-hub-backend`
  (NestJS).
- Backend exports OpenAPI; the frontend generates types from
  `http://localhost:3001/docs-json`.
- PostgreSQL is the only database. MongoDB/Mongoose was removed from the
  repository.
- API prefix: `/api/v1`. Swagger UI: `/docs`.

---

## 2. Authentication and token storage

- Providers: Google OAuth, GitHub OAuth, and email/password (kept because the
  boilerplate already provides it and it is useful for local testing).
- The frontend obtains the provider access token and sends it to:
  - `POST /api/v1/auth/google/login` with `idToken`;
  - `POST /api/v1/auth/github/login` with `accessToken`.
- The backend returns `token`, `refreshToken` and `tokenExpires` in the JSON
  body. No authentication cookie is set by the backend.
- **Decision**: the frontend stores the token pair in browser storage and sends
  `Authorization: Bearer <token>` on every request. The current boilerplate
  stores the pair in a cookie; this must be changed in the frontend before the
  demo because the SRS forbids cookies for tokens.
- Access token lifetime: 15 minutes. Refresh token lifetime: 30 days.
- On `401`, the frontend calls `POST /api/v1/auth/refresh`, replaces the pair
  and retries once. On refresh failure it clears the pair and redirects to
  login.
- Logout calls `POST /api/v1/auth/logout` and clears local state even if the
  request fails.

### GitHub OAuth notes

- The frontend requests the `read:user` and `user:email` scopes.
- The backend calls `GET https://api.github.com/user`; if the public email is
  missing, it calls `GET https://api.github.com/user/emails` and uses the
  verified primary email.
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` live in `.env` and are never
  committed.

---

## 3. Sandbox: run and grade

**Decision: Option A - browser sandbox for "Run", server-side re-grade for
"Submit".**

- `POST /api/v1/labs/:id/run` (or the browser-side equivalent) executes the
  learner query in a client-side SQLite/PGlite database created from the
  dataset `setup_sql`. It is safe for the server and gives instant feedback.
- `POST /api/v1/labs/:id/submit` must never trust the client result. The server
  executes the learner query and the expected query against the same dataset in
  an isolated, read-only sandbox (PGlite in Node or a dedicated read-only
  PostgreSQL schema), then compares the two result sets.
- Result comparison is set-based, not string-based. Row order is ignored unless
  `lab.order_sensitive = true`.
- Limits: only `SELECT`; maximum 5 seconds; maximum 1,000 returned rows; rate
  limit per user per minute. The server rejects `INSERT`, `UPDATE`, `DELETE`,
  `DROP`, `ALTER`, `CREATE`, transaction control and system functions.
- Expected queries are stored in `lab.expected_query` and are never sent to the
  browser.

The sandbox implementation belongs to the Lab module (M3). This decision only
fixes the contract and the security boundary.

---

## 4. Database and content model

- ORM: TypeORM, `synchronize: false`. Every schema change needs a migration in
  `src/database/migrations`.
- Initial schema: `1715028537217-CreateUser.ts` and
  `1793000000000-CreateSqlHubSchema.ts`.
- Bilingual content is stored in translation tables:
  - `course_translation`, `lesson_translation`;
  - `quiz_translation`, `quiz_question_translation`,
    `question_option_translation`;
  - `lab_translation`.
- Every translation table has a unique `(entity_id, locale)` index.
- `user.locale` stores the preferred language (`vi` by default).
- Seed data lives in `src/database/seeds/relational` and is idempotent. Run it
  with `npm run seed:run` after `npm run migration:run`.

### Ownership

| Area | Owner | Backend folder |
|---|---|---|
| Auth, users, roles, statuses, project skeleton | Lead | `src/auth*`, `src/users`, `src/roles`, `src/statuses` |
| Courses, lessons, progress | M1 | `src/courses`, `src/lessons` |
| Quizzes | M2 | `src/quizzes` |
| Labs, datasets, sandbox | M3 | `src/labs`, `src/datasets` |
| Admin, seed aggregation, i18n checks, AI assistant | M4 | `src/admin`, `src/database/seeds` |

Shared changes (global config, `app.module.ts`, migrations) need the lead's
approval.

---

## 5. Internationalization

- `nestjs-i18n` with `vi` as the fallback language.
- Clients send the language in the `x-custom-lang` header; content endpoints
  also accept `?locale=vi|en`.
- All user-facing content must have both `vi` and `en` rows. Missing
  translations fall back to the other locale, then to the slug/title.
- The `vi` message catalogue lives in `src/i18n/vi`.

---

## 6. Security baseline

- Secrets only in environment variables. The pre-commit hook
  (`scripts/check-secrets.js`) and CI block known token patterns.
- CORS origins come from `APP_CORS_ORIGINS` (comma-separated); the frontend
  origin must be listed explicitly.
- Helmet is enabled.
- Input is validated with `class-validator`; unknown fields are rejected by the
  global `ValidationPipe`.
- Passwords are hashed with bcrypt. OAuth-only users have no password.
- Admin endpoints require `@Roles(RoleEnum.admin)` and the JWT guard.
- The sandbox is read-only and resource-limited.

---

## 7. Local development

```bash
cp .env.example .env
npm install
docker compose up -d postgres maildev adminer
npm run migration:run
npm run seed:run
npm run start:dev
```

- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs-json`
- Seed accounts: `admin@example.com` / `secret`, `john.doe@example.com` /
  `secret` (development only).

---

## 8. Boilerplate conventions (hexagonal architecture)

The backend follows the Brocoders NestJS boilerplate structure:

```text
src/<module>/
├── domain/                 # domain entity, no infrastructure dependency
├── dto/                    # request/response DTOs with Swagger decorators
├── infrastructure/
│   └── persistence/
│       └── relational/
│           ├── entities/   # TypeORM entities
│           ├── mappers/    # entity <-> domain mapper
│           └── repositories/
├── controller.ts
├── module.ts
└── service.ts
```

- Repositories expose small, intention-revealing methods instead of a generic
  `find(condition)`.
- Controllers stay thin; business rules live in services.
- DTOs are the API contract; do not return TypeORM entities directly.
- Each module owns its folder; shared changes require lead review.
