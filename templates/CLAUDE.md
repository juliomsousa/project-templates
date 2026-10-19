# Project guide for Claude

React Native app (TypeScript, pnpm). The full conventions live in `docs/conventions/`. Read the doc that matches the task **before** writing code. This file only holds the rules that apply to every change.

## Read before you work

| Task | Read |
|---|---|
| New screen, component, hook or refactor | `docs/conventions/02-folder-structure.md`, `03-coding-conventions.md` |
| API call, query, mutation, error handling | `docs/conventions/04-data-layer.md` |
| Store, persistence, env var, translation | `docs/conventions/05-state-env-i18n.md` |
| Any test | `docs/conventions/06-testing.md` |
| Logging, analytics, error boundaries | `docs/conventions/09-observability.md` |
| Dependencies, CI, commits | `docs/conventions/07-workflow-and-constraints.md` |
| Non-trivial feature | `docs/conventions/08-ai-workflow.md`: write a spec first |

## Always

- Run `pnpm typecheck && pnpm lint && pnpm test` before saying a change is done. Report failures with the output; never claim success without running them.
- Use named exports. The only default exports allowed are files Expo Router requires.
- Don't create barrel files. Import with the `@app/*` alias.
- Make network calls only through `callApi` plus a per-endpoint hook in `src/services/<domain>Service/`.
- No hard-coded user-facing strings (`t()`), testIDs (`constants/locators.ts`), colours or spacing (theme).
- No `console.*` (use `logger`) and no `@ts-ignore` (use `@ts-expect-error: <reason>`).
- Colocate tests with the code. Prefer snapshot tests, name tests Given/When/Then, and keep coverage at or above 90%.
- When you add an env var, add it to `.env.sample`, `src/rawEnv.ts` and `src/env.ts`.
- Secrets go to the Keychain via `services/auth/secureStorage`, never to MMKV, env vars or navigation params.

## Never without asking

- Change `index.js`, native folders (`ios/`, `android/`), CI workflows or `pnpm-workspace.yaml`.
- Add a dependency. Check its size first (docs/conventions/03 › Heavy dependencies) and say why it is needed.
- Update snapshots (`-u`) without showing the diff.
- Commit, push or open a PR.

## Skills

- `/implement-spec <spec>`: implement an approved spec from `docs/specs/`.
- `/create-test <file>`: write tests for a file, following docs/conventions/06.
- `/refactor-tests <file>`: improve existing tests without touching production code.
- `/fix-vulnerabilities`: optional, non-blocking dependency vulnerability fixes.
