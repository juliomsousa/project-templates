---
name: discovery-brownfield
description: Onboard an existing codebase into the squad using the pinned BMAD skills - deep recon, project context, architecture as-is, then an "align to template" epic before any feature. Use when resuming a paused project.
disable-model-invocation: true
---

# Discovery (existing project)

1. `bmad-deep-recon` — produce the cited report of what the code and git history actually do. No recommendations yet.
2. `bmad-project-context` — write the verified context block into `AGENTS.md` without overwriting existing `CLAUDE.md` rules.
3. `bmad-architecture` — record the conventions that exist today. Then list, with the human, which of them migrate to `docs/conventions/` and which stay.
4. `bmad-agent-po` (Sofia) — first epic is always **Align to template** (lint, structure, data layer, tests, CI). Each story has a `Verify:` line that proves the migration (e.g. "pnpm lint passes", "coverage ≥ 90%").
5. Only after that epic is done, run `bmad-prd` in edit mode for new features.
6. Publish tickets as in greenfield.
