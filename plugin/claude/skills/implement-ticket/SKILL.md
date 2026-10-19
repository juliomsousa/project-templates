---
name: implement-ticket
description: Implement one BMAD ticket end to end in the current worktree: read the ticket and conventions, plan, code, test, commit, push and open a pull request. Use when asked to implement a ticket id.
argument-hint: <ticket-id>
disable-model-invocation: true
---

# Implement ticket $0

## 1. Load context
1. `cat squad.config.json`. Note `quality.commands`, `gates`, `project.type`.
2. Find the ticket `$0` in `_bmad-output/**/tickets/tickets.toml` and its story file (`story-$0*.md`, `story-$0*-plan.md`) if present. Read the parent epic file for requirements.
3. Read `AGENTS.md`, then the convention docs that match the task (the table in `CLAUDE.md`).
4. Read every file the ticket names. Read neighbours to learn the existing patterns before adding anything.

## 2. Plan
Write a short plan into `.squad/tickets/$0/plan.md`: files to create or edit, data flow, tests, i18n keys, analytics events, feature flags, and the `Verify:` steps you will make pass. If the ticket is ambiguous or conflicts with the conventions, stop and return `blocked` with `unclear-ticket` and the exact question.

## 3. Branch
`git switch -c <type>/$0-<slug>` from the default branch. Confirm `git status` is clean before editing.

## 4. Implement
- Only the files in the plan. If you need another file, add it to the plan with a reason.
- Library APIs: Context7 first (`resolve-library-id` then `query-docs` with the project's version); official docs if the version is missing.
- No comments that restate the code. Do not touch comments written by humans.
- Every user-facing string goes through i18n; every test id through the locators constants; every colour or spacing through the theme (see conventions).

## 5. Test
Write the tests the ticket and the conventions demand. Run every command in `quality.commands`. Fix until all pass. Paste the final output into `.squad/tickets/$0/quality.log`.

## 6. Commit and push
Conventional Commit in English, ticket id in the scope: `feat($0): <summary>`. The pre-commit hook re-runs the quality commands; do not try to skip it. Push the branch.

## 7. Pull request
`gh pr create --fill --body-file .squad/tickets/$0/pr.md` where `pr.md` contains: ticket id and link to the issue, what changed, how to verify (the `Verify:` steps), quality output summary, anything out of scope you noticed. Add label `squad`. If the ticket has `hitl = true`, also add label `needs-human`.

## 8. Return
Print the JSON described in your agent definition. Nothing else.
