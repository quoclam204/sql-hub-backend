---
description: Scaffold a SQLHub feature following the team's 7-step checklist
---

Use this command when starting a new backend feature for SQLHub.

Feature / requirement: $ARGUMENTS

Follow the checklist in `CLAUDE.md`:

1. Create a branch from `develop` named `feat/<module>-<short-description>`.
2. Add or update the TypeORM entity and create a migration:
   - `npm run migration:generate -- src/database/migrations/<Name>`
   - `npm run migration:run`
3. Implement controller, service and DTOs. Add complete Swagger decorators
   (`@ApiTags`, `@ApiOkResponse`, `@ApiProperty`, `@ApiPropertyOptional`).
4. Tell the frontend to run `npm run gen:api` after the Swagger contract is ready.
5. Return bilingual content (`vi`, `en`) from translation tables; never return a
   single hard-coded language when the requirement is bilingual.
6. Add unit or e2e tests for business rules (grading, auth, permissions).
7. Open a PR into `develop` and fill in the "AI đã giúp gì" section.

Before writing code:

- Read `CLAUDE.md` and the relevant module under `src/`.
- Keep changes inside the module folder owned by the assignee.
- Do not use MongoDB or Mongoose.
- Do not allow write statements in the SQL sandbox.
- Do not commit secrets; the pre-commit hook will block them.

After writing code:

- Run `npm run lint`, `npm test -- --passWithNoTests` and `npm run build`.
- Report the endpoints added, the migration name and the test command used.
