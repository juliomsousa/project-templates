# Squad plugin

The stack-agnostic part of the squad. `squad-init` copies this folder into every new project; nothing here is installed by reference.

| Source | Destination in the project | Purpose |
|---|---|---|
| `claude/agents/` | `.claude/agents/` | `squad-orchestrator` (Opus), `squad-dev` (Sonnet, worktree), `squad-verifier` (Sonnet, review + QA in one pass) |
| `claude/skills/` | `.claude/skills/` | `squad-run`, `implement-ticket`, `verify-ticket`, `discovery-greenfield`, `discovery-brownfield`, `release-prepare`, `squad-sync` |
| `claude/hooks/` | `.claude/hooks/` | Enforcement: no push to main, quality before commit, dependency guard, secret guard, protected paths, notifications |
| `claude/settings.json` | `.claude/settings.json` | Permissions and hook registration |
| `mcp.json` | `.mcp.json` | Context7 for library docs (mobile adds agent-device and maestro) |
| `AGENTS.md` | `AGENTS.md` | Universal rules: English artifacts, no redundant comments, docs lookup order, scope, quality, git, secrets |
| `github/workflows/` | `.github/workflows/` | `verifier-check` (verdict → check run), `release-please`, `release-mobile` (tag → EAS/Fastlane) |
| `github/rulesets/main.json` | `.github/rulesets/` | Required status checks, 0 approvals, squash only |
| `squad.config.example.json` | `squad.config.json` | Per-project configuration read by hooks, skills and agents |
| `scripts/squad-doctor.sh` | `scripts/` | Presence check of tools and credentials; never prints values |
| `VERSION` | `squad.config.json#structure_version` | Structure version and the pinned BMAD ref |

## How the loop works

```
/squad-run → orchestrator reads tickets.toml
   → squad-dev (worktree) implements ticket → PR
   → squad-verifier reviews + builds + runs Verify steps → verdict JSON in a PR comment
   → verifier-check workflow turns the verdict into the required check "verifier"
   → gh pr merge --auto (unless the ticket is hitl → label needs-human, human reviews in Plannotator)
   → release-please keeps a Release PR; merging it tags and triggers release-mobile
```

## Project-side requirements

- `gh` authenticated; repo secret `SQUAD_GH_TOKEN` (GitHub App token or PAT) so agent-created commits trigger CI and release-please tags trigger the release workflow.
- Protected environment `release` holding store credentials (`EXPO_TOKEN`, or `MATCH_PASSWORD`, `ASC_API_KEY_JSON`, `PLAY_SERVICE_ACCOUNT_JSON`).
- `jq` and `curl` on the machine running the agents (hooks use them).
- Mobile: Java 17+, Maestro CLI, Android SDK or Xcode for the verifier.

## Before first use

- Pin `bmad_ref` in `VERSION` to a BMAD-METHOD v7 commit.
- Pin the actions in `github/workflows/` to commit SHAs (the mobile template's `ci.yaml` shows the convention).
- Run every hook once with a fake payload (see `claude/hooks/*.sh` headers) on the target machine; they target bash 3.2+ and need `jq`.
- Test `/squad-run --dry-run` on a project with one ticket.

## Known limits

- Plugin-installed subagents ignore `permissionMode`, `hooks` and `mcpServers`; that is why this folder is copied into `.claude/`, not installed as a plugin.
- The verifier can only run what the machine can build. iOS verification stays local; Android is the CI-friendly target.
- Nothing here merges a `hitl` ticket; that is the human's click, by design.
