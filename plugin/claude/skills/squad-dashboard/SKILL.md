---
name: squad-dashboard
description: Generate the read-only project dashboard (.squad/dashboard/index.html) from tickets.toml, planning documents, .squad/status.json, .squad/log.jsonl and GitHub, then open it. Use to see where the project stands without opening several tools.
argument-hint: [--no-open]
---

# Squad dashboard

1. Run `node scripts/squad-dashboard.mjs` from the project root. It writes `.squad/dashboard/index.html` and `.squad/dashboard/data.json`. It never modifies tickets, status or GitHub.
2. Unless `--no-open` was given, open the page (`open .squad/dashboard/index.html` on macOS, `xdg-open` on Linux).
3. Report the one-line summary the script prints (tickets, events, GitHub availability).

The page has two views, Plan (documents, epics, stories, Verify steps, human-review flags, pending decisions) and Delivery (tiles, current ticket, pipeline, run log with agent time, your queue). Every control is a link or the Refresh button; decisions are made in the files, in Plannotator or on GitHub, never on the page.

Data contract the orchestrator, dev and verifier must keep (`.squad/log.jsonl`, one JSON object per line): `ts`, `ticket`, `event` in `dev.start | dev.end | verify.start | verify.end | awaiting-human | merged | blocked | guard`, plus `attempt`, `model`, `pr`, `verdict`, `findings`, `tokens`, `reason`, `detail`, `hook` when relevant. Agent time per ticket is computed from `dev.start→dev.end` and `verify.start→verify.end`.
