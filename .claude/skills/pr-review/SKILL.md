---
name: pr-review
description: Review a SQLHub backend pull request against the team checklist (SRS, security, i18n, migrations, tests, AI log). Use when the lead or a reviewer asks to review a PR or a diff.
---

# SQLHub PR review

## Before reading the code

- Confirm the PR targets `develop`, not `main`.
- Confirm the title follows Conventional Commits (`feat:`, `fix:`, ...).
- Confirm the PR description has an "AI đã giúp gì" section.
- Confirm the change stays inside the owner's module folder. Shared changes
  need the lead's approval.

## Checklist

### Scope and API

- [ ] The endpoint matches the SRS API list (`/api/v1/...`).
- [ ] Swagger decorators and response DTOs are present.
- [ ] Input is validated with `class-validator`; no raw body is trusted.
- [ ] Authorization is enforced (`@Roles`, guards) for admin endpoints.

### Database

- [ ] Entity changes are accompanied by a migration.
- [ ] The migration has a working `down()`.
- [ ] Foreign keys have the right `ON DELETE` behavior.
- [ ] No `synchronize: true` in production.
- [ ] No MongoDB/Mongoose code was reintroduced.

### i18n

- [ ] User-facing content has `vi` and `en` translations.
- [ ] The `x-custom-lang` header or `locale` query is respected.
- [ ] No hard-coded Vietnamese string in a response DTO.

### Security

- [ ] No secret, token or credential in the diff.
- [ ] The SQL sandbox still rejects write/DDL statements.
- [ ] Time and row limits are enforced.
- [ ] Access tokens stay in the `Authorization` header, not cookies.

### Tests

- [ ] New business logic has a unit or e2e test.
- [ ] Auth and grading changes have tests.
- [ ] `npm run lint`, `npm test -- --passWithNoTests` and `npm run build` pass.

## Review output

Report findings as:

```md
### Blocking
- file:line - problem - suggested fix

### Non-blocking
- file:line - suggestion

### Verification
- commands run and result
```

Do not approve a PR with failing CI or with an unanswered security finding.
