# 08 — AI-assisted workflow (Claude)

The primary agent is **Claude Code**. The setup is in the template root:

| File | Purpose |
|---|---|
| `CLAUDE.md` | Short guide: the rules for every change, a "read this doc before that task" table, what needs approval, and the skill list. It points to `docs/conventions/` instead of copying them, so it doesn't drift from the code |
| `.claude/settings.json` | Allows the read-only and quality commands (`pnpm typecheck`, `lint`, `test`, `why`, `git diff` …) without a prompt. Denies reading `.env.*` and `.npmrc` |
| `.claude/skills/` | Repeatable task procedures, invoked as `/skill-name` |
| `docs/specs/` | One spec per non-trivial feature, plus `_TEMPLATE.md` |

Keep `CLAUDE.md` short. Detail belongs in the convention docs, which humans read too. When a convention changes, change the doc and leave `CLAUDE.md` alone unless an "Always" rule changed.

## Spec-first workflow

For anything bigger than a small fix, plan before code:

```
1. Request   →  2. Spec (Claude drafts)  →  3. Review (human)  →  4. /implement-spec  →  5. PR
   issue /        docs/specs/NN_<topic>.md     Status: Approved       follows the spec,
   prompt         from _TEMPLATE.md                                   asks instead of deciding
```

1. **Request:** describe the goal, constraints and references (designs, API contract, a similar feature).
2. **Spec:** ask Claude to draft `docs/specs/NN_<topic>.md` from `_TEMPLATE.md`, with **no code yet**. The spec covers:
   - overview and current state
   - architecture (endpoints, query keys, stores and their scope, flags, analytics events, navigation, i18n keys)
   - the exact file structure and implementation steps
   - the test table
   - out-of-scope items, open questions and a decisions log
3. **Review:** a human answers the open questions, corrects the plan and sets `Status: Approved`. Reviewing a plan is much cheaper than reviewing a wrong implementation.
4. **Implement:** `/implement-spec docs/specs/NN_<topic>.md`. Claude follows the steps and creates only the listed files. When something is ambiguous it **asks**, it runs `typecheck`, `lint` and `test`, and it records any deviation in the decisions log.
5. **PR:** link the spec in the PR description. Specs stay in the repo as the record of why things were built this way.

Number specs sequentially (`01_`, `02_` …) so the history reads in order.

## Skills

| Skill | When | Notes |
|---|---|---|
| `/implement-spec <spec>` | An approved spec is ready | User-triggered only. Stops on `Draft` specs |
| `/create-test <file>` | Adding tests | Snapshot-first, Given/When/Then, ≥ 90% |
| `/refactor-tests <file>` | Cleaning up tests | **Only test files may change.** Coverage must not drop |
| `/fix-vulnerabilities` | Whenever you want, after CI reports vulnerabilities | Optional and non-blocking. Unresolved items become warnings. User-triggered only |

Add a skill when the same multi-step instruction has been typed into a prompt more than twice. Keep each skill under a page, and link to the docs instead of restating them.

## Working rules for the agent

- Read the relevant convention doc before writing code (`CLAUDE.md` › Read before you work).
- Never claim a task is done without running `pnpm typecheck && pnpm lint && pnpm test`, and report failures with their output.
- Ask before adding dependencies, touching native folders or CI, or updating snapshots.
- Never commit, push or open PRs unless asked.
