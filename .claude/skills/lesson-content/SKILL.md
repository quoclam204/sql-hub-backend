---
name: lesson-content
description: Draft or review bilingual SQLHub lesson, quiz and lab content (Vietnamese and English) that matches the database schema and the SRS. Use when creating seed data, lesson markdown, quiz questions, lab descriptions, hints or translations.
---

# Bilingual SQLHub content

## Output contract

Every content item must have:

- a stable `slug` in kebab-case;
- a Vietnamese (`vi`) and an English (`en`) translation;
- a clear learning objective;
- SQL examples that actually run on the dataset used by the lab.

Lesson markdown is stored in `lesson_translation.content_md`. Quiz and lab
content is stored in the translation tables (`quiz_translation`,
`quiz_question_translation`, `question_option_translation`,
`lab_translation`).

## Lesson structure

```md
# <Title>

## Mục tiêu / Objectives

## Kiến thức / Concept

## Ví dụ / Example

~~~sql
SELECT ...
~~~

## Bài tập nhanh / Quick practice
```

Keep code blocks fenced with `~~~sql` so they survive JSON and seed files.

## Quiz rules

- One correct answer per question unless the requirement explicitly asks for
  multiple answers.
- Exactly four options is the default; at least three.
- The explanation must say why the correct answer is right and why the common
  wrong answer is wrong.
- Do not copy the explanation verbatim into the question.

## Lab rules

- The sandbox is read-only: only `SELECT` is allowed.
- The expected query must return the same result set as the learner query.
  Order matters only when `order_sensitive = true`.
- Keep datasets small (tens of rows) so the sandbox stays under 5 seconds.
- Hints must guide without revealing the final query.
- State the row limit (1,000) and the time limit (5 seconds) in the lab UI copy.

## Review checklist

- [ ] Vietnamese and English versions carry the same meaning.
- [ ] SQL was executed against the seed dataset.
- [ ] Expected query and explanation were checked by a human.
- [ ] No secret, credential or internal URL appears in the content.
- [ ] Markdown renders correctly (headings, tables, code fences).
