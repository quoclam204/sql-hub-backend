# M1/M2/M3 Content Handoff Checklist

This checklist defines the official bilingual content handoff required before
M4 adds relational seed data. It follows the existing bulk-import contract; it
does not introduce a second content format.

## M1 — Lessons

Provide lesson JSON or Markdown accepted by the lessons importer with:

- `courseId` or `courseSlug`
- unique lesson `slug`
- `order`
- `titleVi`
- `contentVi`
- `titleEn`
- `contentEn`

Each course must have at least five lessons. The SRS requires at least three
courses, and the initial lessons must include English content.

## M2 — Quizzes

Provide quiz-question JSON accepted by the quiz-question importer with:

- quiz-to-lesson reference (`quizId`, or the established lesson mapping)
- question `order`
- `questionTextVi` and `questionTextEn`
- `explanationVi` and `explanationEn` where supplied
- `options`
- each option's `optionTextVi`
- each option's `optionTextEn` where supplied
- exactly one `isCorrect: true` option
- option `order`

The SRS target is at least three questions per lesson.

## M3 — Datasets and SQL labs

Provide dataset and lab data accepted by the existing lab importer:

- dataset `name`
- dataset `setupSql`
- `datasetId` or `datasetName`
- `lessonId` or `lessonSlug`
- `expectedQuery`
- `orderSensitive`
- `titleVi`, `descriptionVi`, and optional `hintVi`
- `titleEn`, `descriptionEn`, and optional `hintEn`

The SRS target is at least two labs per course. M3 must verify that setup SQL
and expected queries execute safely under the lab restrictions before handoff.

## Shared manifest and acceptance evidence

The handoff must include a manifest that explicitly maps:

```text
course -> lesson -> quiz/questions/options -> dataset -> lab
```

The manifest must use the same IDs or slugs as the payload files. The handoff
owner must identify the owning module/team (M1, M2, or M3), the source commit or
export, and the validation date. Sample data embedded in tests or importer
documentation is not an official handoff.

Before M4 accepts the handoff:

- all course, lesson, quiz, dataset, and lab references resolve;
- required `vi`/`en` fields are present;
- unique slugs and locale-per-entity constraints pass;
- quiz questions have exactly one correct option;
- dataset setup SQL and lab expected queries have been verified by M3;
- the importer dry-run completes with zero errors;
- the import is run transactionally and its result is recorded.

Submit the payload files, manifest, and validation evidence together in a
reviewable commit or shared handoff folder. M4 will then add dependency-safe,
idempotent relational seed services after the existing course seed.
