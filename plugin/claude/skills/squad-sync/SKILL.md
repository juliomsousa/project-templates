---
name: squad-sync
description: Compare this project's squad structure (hooks, rules, workflows, agents) with the squad-ai monorepo version recorded in squad.config.json and propose the differences as a ticket. Placeholder until phase 6.
disable-model-invocation: true
---

Not implemented yet. Planned behaviour: read `structure_version` from `squad.config.json`, diff `.claude/`, `.github/` and `AGENTS.md` against the monorepo at that version, and open an issue "Sync squad structure to <version>" with the diff summary.
