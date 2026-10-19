# Mobile template (React Native)

Conventions, constraints and starter files for React Native projects built by the squad. `/squad-init` applies this template automatically; the steps below describe what it does. This folder has two parts:

- **`docs/`**: the rules, the reasons for them, and code examples. Copy them into each new project as `docs/conventions/`.
- **`files/`**: files to copy into a freshly initialised project. Paths mirror the target project root.

## How to use

1. **Plan:** go through [Decisions to make during planning](#decisions-to-make-during-planning) with the project owner.
2. **Init** the project with the chosen workflow (Bare React Native CLI or Expo).
3. **Copy** `files/` over the new project and `docs/` to `docs/conventions/`. Then resolve each `TODO(init)` marker, which sits where Bare and Expo differ:
   - **Expo:** rename `metro.config.expo.js` to `metro.config.js`.
   - **Bare:** delete `metro.config.expo.js`.
4. **Install** the dependencies listed in [docs/01-stack.md](docs/01-stack.md), including the Rozenite devtools plugin for each library that has one. Libraries that tend to ship breaking changes get exact versions.
5. **Run** `pnpm env:validate && pnpm typecheck && pnpm lint && pnpm test`. All four must pass before the first commit.
6. **Work spec-first with Claude** ([docs/08](docs/08-ai-workflow.md)): `CLAUDE.md` and `.claude/skills/` are already in `files/`.

## Docs

| # | Doc | Covers |
|---|---|---|
| 01 | [Stack](docs/01-stack.md) | Libraries, versions, usehooks-ts, Rozenite devtools |
| 02 | [Folder structure](docs/02-folder-structure.md) | Directory layout and placement rules |
| 03 | [Coding conventions](docs/03-coding-conventions.md) | Formatting, lint, naming, imports, TypeScript, components, styling, SVG, error boundaries, feature flags, forms, navigation building blocks |
| 04 | [Data layer](docs/04-data-layer.md) | Typed HTTP client, query hooks, errors, token refresh (with code) |
| 05 | [State, env & i18n](docs/05-state-env-i18n.md) | Zustand + store registry, MMKV, Keychain and biometrics, env validation, variants, translations |
| 06 | [Testing](docs/06-testing.md) | Jest, snapshot-first, test utils, dates, coverage, E2E conventions |
| 07 | [Workflow & constraints](docs/07-workflow-and-constraints.md) | Commits, CI (report-only vulnerabilities), supply chain, hard rules |
| 08 | [AI workflow](docs/08-ai-workflow.md) | Claude setup, spec-first flow, skills |
| 09 | [Observability](docs/09-observability.md) | Logger and sinks, monitoring adapter, analytics adapter + consent |

## Decisions to make during planning

These are deliberately **not** fixed by the template. Ask the project owner before scaffolding:

| Topic | Options / notes |
|---|---|
| Init workflow | **Bare RN CLI** or **Expo**. This choice decides navigation, env injection, build variants, Metro config and the Jest preset |
| Navigation | React Navigation (Bare) or Expo Router (Expo). **Ask for a code reference from another project before implementing.** The reusable building blocks are in [03](docs/03-coding-conventions.md#navigation) |
| Auth provider | Implement `setTokenRefresher` and login with it ([04](docs/04-data-layer.md#authentication--token-refresh)) |
| Monitoring / crash reporting | Any vendor. Write a log-sink adapter ([09](docs/09-observability.md)) |
| Product analytics | Any vendor, or none. Write an analytics adapter ([09](docs/09-observability.md)) |
| Feature-flag source | Remote config tool, login payload or a backend endpoint. It feeds `setFlags` ([03](docs/03-coding-conventions.md#feature-flags)) |
| E2E tool | e.g. Maestro or Detox. The conventions are already defined ([06](docs/06-testing.md#e2e)) |
| Accessibility | If requested, add `@react-native-ama/*` and the a11y conventions. Can be added after init |
| Security hardening | SSL pinning, jailbreak/root detection. Only if the project requires them |
| Server-state persistence | Whether the TanStack Query cache is persisted to disk |

## Fixed conventions (summary)

- **Tooling:** pnpm, TypeScript strict, `@app/*` path alias, named exports (Expo Router files are the only exception), no barrel files.
- **Structure:** feature-first `src/features/<feature>/<Screen>/`, with each screen in its own folder.
- **Data:**
  - One typed HTTP client, with a fetcher and a TanStack Query hook per endpoint.
  - Token refresh happens only once even when several requests need it at the same time.
- **State:**
  - Zustand stores register themselves and reset on logout.
  - Non-sensitive data is persisted to MMKV.
  - Secrets go to the Keychain/Keystore.
- **Validation:** Zod validates env, forms and external data, with Zod's own messages translated.
- **Styling:**
  - Unistyles 3, pinned to an exact version, with every value coming from the theme.
  - SVGs are imported as components and coloured from the theme.
- **i18n:** i18next with `en`, `es` and `pt-BR`.
- **Testing:** Jest + Testing Library, snapshot-first, Given/When/Then names, a 90% coverage gate.
- **Observability:** vendor-neutral facades for logging, monitoring and analytics, plus error boundaries.
- **Devtools:** Rozenite, with a plugin for each library that has one.
- **CI:**
  - Conventional Commits.
  - Secret detection blocks the merge.
  - Vulnerabilities are report-only but visible: a PR comment, the job summary, annotations and a weekly issue.
- **AI:** Claude Code with `CLAUDE.md`, skills, and a spec-first workflow.
- **Bundler:** Metro, the React Native default. Heavy dependencies are imported by subpath and the bundle size is measured.
