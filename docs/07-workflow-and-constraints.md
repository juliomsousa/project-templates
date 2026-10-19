# 07 — Workflow & constraints

## Commits & PRs

- **Conventional Commits** for every commit **and** the PR title, enforced in CI by commitlint (`commitlint.config.mjs`, with `body-max-line-length` disabled).
  - `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`, `ci`, `build`; `!` marks a breaking change.
  - Optional scope: `fix(profile): …`.
- **Branch names** follow `<type>/<ticket-id>-<short-slug>` (e.g. `feat/ABC-123-profile-card`). The ticket ID comes from whatever tracker the project uses, and can be dropped if there is none.
- The **PR template** (`.github/pull_request_template.md`) asks what changed, why, before/after screenshots for UI changes, and a link to the related issue.
- **There are no local git hooks.** All gates run in CI.

## CI

### `ci.yaml` (every PR to `main`, `release/**`, `hotfix/**`)

| Job | Blocking? | What it does |
|---|---|---|
| Validate PR title / commits | ✅ | commitlint |
| **Secret detection** | ✅ | Trivy `scanners: secret`. A committed token must be removed (and rotated) before merge |
| **Dependency vulnerabilities** | ❌ report-only | Trivy `scanners: vuln`, CRITICAL / HIGH / MEDIUM, made visible in three places (below) |
| Typecheck, lint & test | ✅ | Runs only when code changed (`dorny/paths-filter`). Otherwise the job passes with a "skipped" message, so required checks stay green on docs-only PRs |

Every job has a `timeout-minutes` and least-privilege `permissions`: `contents: read` by default, with `pull-requests: write` only on the vulnerability job. Old runs are cancelled when new commits arrive.

**How report-only vulnerabilities stay visible** (`scripts/ci/trivy-report.mjs`):

1. **Sticky PR comment:** one comment with severity counts and a table (package, installed, fixed in, advisory), updated in place on each push (`scripts/ci/upsert-comment.sh`). On fork PRs, whose token is read-only, it fails softly.
2. **Job summary:** the same table at the top of the CI run page.
3. **Warning annotations:** a yellow summary warning plus one per CRITICAL/HIGH finding (up to the GitHub limit) in the PR's checks.

### `security-scan.yaml` (weekly + manual)

This scans `main` every Monday, catching new CVEs in dependencies nobody touched. It keeps **one** issue labelled `dependency-vulnerabilities`: it opens the issue when findings exist, updates the same issue on later runs, and closes it with a comment when the scan is clean.

### Fixing vulnerabilities

Run the optional `/fix-vulnerabilities` Claude skill (`.claude/skills/fix-vulnerabilities/`) whenever you want. It tries, in order: an in-range `pnpm update`, a direct bump, then `overrides`. It rechecks `patches/` and finishes with a table. Anything it can't fix safely is reported as a ⚠️ warning. It never blocks the flow and never commits.

Accepted risks go in `.trivyignore`, each with a reason and a review date, and only with approval.

### Required local check

`pnpm env:validate && pnpm typecheck && pnpm lint && pnpm test`

### Other

- **GitHub Actions are pinned to commit SHAs** with the version in a trailing comment. Dependabot (`.github/dependabot.yml`) bumps npm packages (`chore:` prefix) and actions (`chore(ci):` prefix) weekly.
- **E2E quality workflow (once an E2E tool is chosen):** lint and typecheck `e2e/` in a separate workflow, triggered only when `e2e/**` or the shared `locators.ts` / `screens.ts` change.

## Supply chain

The settings live in `pnpm-workspace.yaml` and `.npmrc`:

| Setting | Effect |
|---|---|
| `minimumReleaseAge: 1440` | Package versions published less than 24 h ago cannot be installed. This is the window in which malicious releases are usually pulled. Your own org's packages can go in `minimumReleaseAgeExclude` |
| `onlyBuiltDependencies` | Allowlist of packages that may run install scripts. Add entries deliberately |
| `overrides` | Force patched versions of vulnerable transitive dependencies |
| `patchedDependencies` + `patches/` | Every library patch is a reviewed file in the repo (`pnpm patch <pkg>`) |
| Exact versions (📌) | For libraries known to break in minors (e.g. Unistyles) and security-sensitive libraries |
| `--frozen-lockfile` in CI | No drift between lockfile and install |
| Registry tokens | Read from env (`${NPM_TOKEN}`) in `.npmrc`. Never commit a literal token |

## Hard rules (summary)

| ❌ Don't | ✅ Do |
|---|---|
| `any` where a type can be known (lint is off, checked in review) | `unknown` + narrowing / Zod |
| `@ts-ignore` | `@ts-expect-error: <reason>` |
| `console.*` | `logger` from `@app/utils/logger/logger` |
| `export default` | Named exports. The only exception is files Expo Router requires |
| `index.ts` barrels | Direct file imports |
| Root imports of heavy libraries | Subpath imports + measure bundle size ([03](03-coding-conventions.md#heavy-dependencies)) |
| `axios` outside `services/http` | `callApi` + per-endpoint hooks |
| Hand-written API types | `pnpm api:types` (OpenAPI) |
| Hard-coded strings, testIDs, colours, spacing | `t()`, `constants/locators.ts`, theme |
| Inline prop types | `interface XProps` |
| New env var in one place only | `.env.sample` + `rawEnv.ts` + `env.ts` |
| Secrets in MMKV, env vars, logs or navigation params | Keychain via `services/auth/secureStorage`. Secrets never go in the bundle |
| Writing tokens to the store directly | `startSession` / `endSession` |
| A store without `reset()` or registration | `INITIAL_STATE` + `reset()` + `registerStore` |
| Server data copied into Zustand | TanStack Query cache |
| Vendor SDK calls in features (analytics, monitoring) | The `trackEvent` / `logger` facades + an adapter |
| Updating snapshots without review | Review the diff, then `-u` |
| Custom ESLint plugins for simple checks | `no-restricted-syntax` / `no-restricted-imports` |
