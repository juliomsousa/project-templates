---
name: squad-run
description: Start the autonomous delivery loop: the orchestrator picks ready tickets, dispatches dev and verifier agents, handles retries, blocks and auto-merge. Use to run the squad on the current backlog.
argument-hint: [--ticket <id>] [--parallel <n>] [--dry-run]
disable-model-invocation: true
context: fork
agent: squad-orchestrator
---

Run the squad delivery loop on this repository with arguments: $ARGUMENTS

- `--ticket <id>`: run only that ticket.
- `--parallel <n>`: allow up to n dev agents at once (default 1).
- `--dry-run`: list what would be dispatched and stop.

Follow the loop in your agent definition. Before the first dispatch, verify: `squad.config.json` exists, `tickets.toml` exists, `gh auth status` succeeds, the working tree is clean and on the default branch. If any check fails, stop and report.

Keep `.squad/status.json` current (`{"current_ticket","state","attempt","pr","updated_at"}`) so notifications and the human can follow progress.

Finish with a summary in the human's language: tickets done, awaiting human, blocked (with reasons), PRs opened, and the next ticket that would run.
