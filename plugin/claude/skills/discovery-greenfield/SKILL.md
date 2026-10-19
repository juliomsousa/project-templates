---
name: discovery-greenfield
description: Guided discovery for a new project using the pinned BMAD skills - brief, PRD, optional UX, architecture, then tickets with Sofia. Use when starting a project from scratch.
disable-model-invocation: true
---

# Discovery (new project)

Run the BMAD planning skills in order, one session each, and stop for the human at the sign-off points. Any product or technical document the human already has goes to `docs/input/` and is passed as source material; ask only about gaps.

1. `bmad-product-brief` — problem, users, outcome. Sign-off: human.
2. `bmad-prd` (create; use the fast path when `docs/input/` exists). Review every assumption the PRD marks. Sign-off: human, through Plannotator.
3. `bmad-ux` — only if the product has screens the PRD does not already describe.
4. `bmad-architecture` — must ask and record every decision in the template's "Decisions to make during planning" table (init workflow, navigation, auth provider, monitoring, analytics, feature flags, E2E tool, accessibility, security hardening, persistence). Sign-off: human.
5. `bmad-agent-po` (Sofia) — slice into epics and stories, produce `tickets.toml`. Every ticket needs a `Verify:` line. Human reviews the order, marks critical tickets `hitl = true`.
6. Publish tickets to GitHub Issues and the Projects board (Sofia's publish, or `gh issue create` per ticket with the ticket id in the title).

All documents in English. Output lives under `_bmad-output/`.
