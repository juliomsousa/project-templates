---
name: squad-init
description: Create a new project repository from this squad-ai monorepo - interview, copy the plugin and the stack template into a fresh repo at a directory the human chooses, install pinned BMAD skills, create the GitHub repo, ruleset and board. Use when starting a new project or onboarding an existing one.
argument-hint: [--brownfield <path>]
disable-model-invocation: true
---

# squad-init $ARGUMENTS

You are running inside the squad-ai monorepo. Nothing you do here modifies this repository. Everything is created in the project directory the human chooses.

## 1. Interview (ask, never assume)
Ask these, one group at a time, in the human's language:
1. **Where to create the project.** Ask for the absolute parent directory and the folder name. Default suggestion: the parent of this monorepo, but the human may keep projects nested elsewhere. Confirm the final path before creating anything. With `--brownfield <path>`, use that existing repo instead and skip creation.
2. Project name, one-line description, stack type: `mobile` | `web` | `backend` (only `mobile` has a template today; for others, copy only `plugin/`).
3. Existing material: product docs, designs, API contracts, an existing repo. Collect paths; they will be copied to `docs/input/`.
4. Risk profile: which kinds of tickets must have human review (`hitl`): auth, payments, data migration, native changes, anything else.
5. QA: platform for automated verification (`android` recommended for cost), E2E tool (`agent-device` default; `maestro` for regression flows), whether a test build command already exists.
6. Notifications: `ntfy` topic or Telegram, or none.
7. GitHub: owner/org for the new repo, private or public, create a Projects board (yes/no).

Do not ask about the remote-control or orchestration UI (Paseo, Claude Code Remote Control, Orca, …). That is the human's tooling choice and nothing in the project depends on it.

## 2. Prerequisites (stop until every item is confirmed)

**Credential policy.** You never ask the human to type a credential into the chat, never read a credential value, never run a command that prints one (`echo $TOKEN`, `cat .env`, `gh secret list --json value`, …). You only tell the human **where to paste it**, then run the local doctor script, which reports presence or absence and nothing else.

1. Show the table below filtered by the interview answers, with the "where to paste" column.
2. Ask the human to configure what is missing.
3. Run `bash $MONOREPO/plugin/scripts/squad-doctor.sh <project-dir>` (after the project exists, also copied to `scripts/squad-doctor.sh`). Read only its PRESENT/MISSING output.
4. Repeat until nothing required is missing. Optional items may stay missing.

| Item | Required when | Where the human configures it |
|---|---|---|
| `claude` logged in with a subscription | always | `claude` → `/login` |
| `gh` authenticated | always | `gh auth login` in their terminal |
| `jq`, `curl`, `node` ≥ 20, `pnpm` (corepack) | always | package manager |
| `uv` + Python ≥ 3.11 | BMAD skills | docs.astral.sh/uv |
| `SQUAD_GH_TOKEN` (GitHub App token or PAT: `repo`, `workflow`, `checks:write`) | always | GitHub → repo → Settings → Secrets and variables → Actions. Checked after the repo exists |
| `release` environment with required reviewer and store secrets (`EXPO_TOKEN`, or `MATCH_PASSWORD`, `ASC_API_KEY_JSON`, `PLAY_SERVICE_ACCOUNT_JSON`) | release workflow | GitHub → repo → Settings → Environments. Never on the laptop, never in the repo |
| `CONTEXT7_API_KEY` | optional | their shell profile (`~/.zshrc`) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram notifications | their shell profile |
| ntfy topic | ntfy notifications | `squad.config.json#notify.topic` (not a secret) |
| Java 17+, Maestro CLI, Android SDK (`ANDROID_HOME`), Xcode | mobile | package manager / Android Studio / App Store |
| `agent-device` | mobile QA | `npx -y agent-device` |
| Plannotator | optional | plannotator.ai |

Record the final doctor output in `.squad/prerequisites.md` inside the project once it exists.

## 3. Scaffold with the official command, commit the boilerplate alone
Create the project exactly as the stack's documentation says, in the directory chosen in step 1. Check the current command with Context7 (`resolve-library-id` → `query-docs`) or the official site before running it; do not rely on memory.

| Stack / choice | Official command (verify first) |
|---|---|
| React Native, Expo | `npx create-expo-app@latest <name>` (expo.dev) |
| React Native, Bare | `npx @react-native-community/cli@latest init <Name>` (reactnative.dev) |
| Web (Next.js) | `npx create-next-app@latest <name>` (nextjs.org) |
| Backend (Node) | `npm init -y` + the framework's own init, or `nest new` (docs.nestjs.com) |

Then, with nothing else changed:
```
cd <path> && git init -b main   # skip if the tool already initialised git
git add -A
git commit -m "chore: initial commit ($TOOL $VERSION)"
```
Brownfield: skip this step entirely; the existing history is the base.

## 4. Apply the squad structure, commit it separately
Copy from the monorepo (`$MONOREPO` = two levels up from `.claude/skills/squad-init`):
- `plugin/claude/` → `.claude/` (brownfield: never overwrite; write `<file>.squad-new` and list them)
- `plugin/AGENTS.md` → `AGENTS.md` (brownfield: append the universal rules if the file exists)
- `plugin/mcp.json` → `.mcp.json` (merge `mcpServers` if it exists)
- `plugin/github/workflows/*` → `.github/workflows/`; `plugin/github/rulesets/main.json` → `.github/rulesets/`
- `plugin/squad.config.example.json` → `squad.config.json`, filled with the interview answers and `structure_version` from `plugin/VERSION`
- `templates/<type>/files/` → project root (over the boilerplate; the template's `package.scripts.jsonc` merges into `package.json`), `templates/<type>/docs/` → `docs/conventions/`. Resolve the `TODO(init)` markers the interview answered. Leave the rest for `bmad-architecture`.
- Existing material → `docs/input/`
- `plugin/scripts/squad-doctor.sh` → `scripts/squad-doctor.sh`; `plugin/scripts/squad-dashboard.mjs` → `scripts/squad-dashboard.mjs`
- Append `.squad/dashboard/` and `.claude/worktrees/` to `.gitignore` (the rest of `.squad/` is committed: status and log are the project's history)
- `chmod +x .claude/hooks/*.sh scripts/squad-doctor.sh`
- Install the template's dependencies with the stack's package manager (exact versions where the template says so). Run the template's required local check (mobile: `pnpm env:validate && pnpm typecheck && pnpm lint && pnpm test`) and fix the scaffold until it passes.

```
git add -A
git commit -m "chore: apply squad structure (squad-ai $STRUCTURE_VERSION)"
```
Every later commit follows Conventional Commits (see root README).

## 5. BMAD
Install the pinned planning skills (ref from `plugin/VERSION`, key `bmad_ref`):
```
npx skills add bmad-code-org/BMAD-METHOD#<ref> --skill bmad --skill bmad-product-brief --skill bmad-prd --skill bmad-ux --skill bmad-architecture --skill bmad-agent-po --skill bmad-project-context --skill bmad-deep-recon
```
Then run `bmad setup`. Write `_bmad/custom/config.toml` with `document_output_language = "en"` and the `_bmad/custom/*.toml` overrides from `templates/<type>/bmad/` when they exist. Record the ref in `squad.config.json#bmad.pinned_ref`. Do not commit yet.

## 6. Mobile E2E MCP servers (mobile only)
Add to `.mcp.json`: `agent-device` (`npx -y agent-device mcp`) and `maestro` (`maestro mcp`). These were already confirmed in step 2.

## 7. GitHub
```
gh repo create <owner>/<name> --<private|public> --source . --push
gh api -X POST repos/<owner>/<name>/rulesets --input .github/rulesets/main.json
```
Create labels `squad`, `needs-human`, `blocked`. If asked, create the Projects board with columns Backlog, Ready, In Progress, Review/QA, Blocked, Done and store its number in `squad.config.json#tracker.project_board`. 

## 8. Push and report
Commit the BMAD and MCP additions as `chore: add bmad planning skills and mcp servers` and push `main`. Tell the human where to paste `SQUAD_GH_TOKEN` and the release secrets (GitHub settings pages above), wait, then run `scripts/squad-doctor.sh` until it reports no missing required item. Print: the project path, the three commits, what was copied, files skipped in brownfield, prerequisites still marked pending, and the next step (`/discovery-greenfield` or `/discovery-brownfield`).
