---
name: verify-ticket
description: Independently verify a pull request for a ticket: review the diff against the ticket and conventions, build the test artifact, run the ticket's Verify steps on simulator or emulator, collect evidence and emit a verdict. Use when asked to verify a PR.
argument-hint: <pr-url-or-number> [ticket-id]
disable-model-invocation: true
---

# Verify PR $0

## 1. Context
1. `cat squad.config.json` → `quality.commands`, `build.test_build`, `qa.*`, `gates.block_on`.
2. `gh pr view $0 --json number,title,body,headRefName,files` and `gh pr diff $0`.
3. Locate the ticket (from the PR body or `$1`) in `tickets.toml`; read its description, `Verify:` steps and the epic requirements.
4. Read `AGENTS.md` and the convention docs relevant to the touched files.

## 2. Review the diff
Check, and record a finding for each violation:
- Scope: every change traces to the ticket; nothing unrelated.
- Conventions: naming, structure, imports, typed props, i18n, locators, theme, data layer rules, store rules.
- Tests: exist for the new behaviour, follow the test conventions, coverage gate respected (read `quality.log` if present, re-run otherwise).
- Comments: none that restate the code; human comments untouched.
- Dependencies: `package.json` diff — any new or major-bumped dependency is a `high` finding unless the PR has label `needs-human`.
- Security: no secrets, no payloads in logs, no tokens in navigation params.

## 3. Run quality
Check out the PR branch in a clean worktree (`gh pr checkout $0` inside `git worktree add .claude/worktrees/verify-<n>`). Run `quality.commands`. Any failure is a `high` finding.

## 4. Build and execute Verify steps
1. Build the test artifact with `build.test_build` for `qa.platform`.
2. Start the simulator or emulator. With `qa.tool = agent-device`: `agent-device` MCP tools to install the artifact, then for each `Verify:` step: perform the steps, `inspect_screen`/`take_screenshot`, assert the expected outcome. Save every screenshot and the accessibility snapshot under `qa.evidence_dir/<ticket>/<step>/`.
3. If the project has Maestro flows for the touched screens (`qa.flows_dir`), run them too and keep the report.
4. A step that cannot be executed (missing device, build failure unrelated to the diff) makes the verdict `blocked`, not `fail`.

## 5. Evidence
Write `qa.evidence_dir/<ticket>/report.md`: table of Verify steps with status and screenshot path, quality output summary, findings list. Comment the report on the PR (`gh pr comment $0 --body-file …`) and upload the screenshots as a PR comment attachment or commit them to the branch under the evidence dir if the project allows it.

## 6. Verdict
Emit the JSON from your agent definition. `pass` requires: zero high findings, every Verify step `pass`, quality green. Never edit the code under review; never approve the PR through GitHub review — the verdict becomes a check run through the `verifier-check` workflow.
