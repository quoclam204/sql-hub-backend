---
description: Record AI assistance for a PR or a weekly summary
---

Append an entry to `docs/ai-log.md` for the current task.

Use this format:

```md
## YYYY-MM-DD - <feature / PR title>

- **Requirement**: <FR-XXX or short description>
- **Main prompt**: <the prompt that produced the most useful result>
- **AI generated**: <files, modules, migrations, tests, docs>
- **Human reviewed / changed**: <what a team member verified or fixed>
- **Verification**: <commands run and their result>
```

Rules:

- Describe what AI produced, not just "AI helped".
- Record the verification command (lint, test, build, manual API call).
- Never paste real secrets, OAuth tokens or production data into the log.
- Keep one entry per PR; add a weekly summary at the end of each week.
