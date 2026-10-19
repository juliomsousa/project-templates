# 02 — Folder structure

```
.
├── index.js | app/ …            # TODO(init): Bare entry point, or Expo Router `app/` dir (routes only, see below)
├── CLAUDE.md                    # Agent guide: rules for every change + which doc to read per task
├── .claude/
│   ├── settings.json            # Allowed read-only commands, denied secret files
│   └── skills/                  # implement-spec, create-test, refactor-tests, fix-vulnerabilities
├── docs/
│   ├── conventions/             # These docs (copied from the template)
│   └── specs/                   # NN_<topic>.md: one spec per non-trivial feature (+ _TEMPLATE.md)
├── metro.config.js              # SVG transformer + Rozenite (Bare and Expo variants in the template)
├── .svgrrc                      # SVG colour → props.fill replacement
├── src/
│   ├── App.tsx                  # Provider tree (Query, SafeArea, ErrorBoundary, navigation container)
│   ├── env.ts                   # Zod-validated env, exports `env`
│   ├── rawEnv.ts                # Reads process.env (shared with scripts/env-check.ts)
│   ├── theme.ts                 # Unistyles theme + StyleSheet.configure
│   ├── declarations.d.ts        # Module declarations (svg, png …)
│   ├── assets/                  # Icons (SVG), images, fonts
│   ├── devtools/useDevTools.ts  # Rozenite plugin hooks (no-op in production)
│   ├── components/              # Cross-feature UI: one folder per component
│   │   ├── ErrorBoundary/       # Logs + translated fallback with retry
│   │   ├── FeatureGate/         # Renders children only when a feature flag is on
│   │   ├── Button/
│   │   │   ├── PrimaryButton.tsx
│   │   │   ├── PrimaryButton.test.tsx
│   │   │   └── __snapshots__/
│   │   ├── Typography/          # Body, Heading, Caption: use these instead of raw <Text>
│   │   └── screens/             # Screen shells: BaseScreen, ScreenScrollView …
│   ├── constants/
│   │   ├── screens.ts           # Route names (if the navigation lib uses named routes)
│   │   └── locators.ts          # Every testID
│   ├── features/                # One folder per product domain
│   │   └── <feature>/
│   │       ├── <ScreenName>/                      # Every screen has its own folder
│   │       │   ├── <ScreenName>.tsx
│   │       │   ├── <ScreenName>.test.tsx
│   │       │   ├── components/<Comp>/<Comp>.tsx   # Screen-private components
│   │       │   └── hooks/                         # Screen-private hooks
│   │       ├── components/      # Shared inside the feature
│   │       ├── hooks/           # Shared inside the feature
│   │       ├── utils/
│   │       └── errors.ts        # Domain error classes
│   ├── hooks/                   # Global hooks: useX/useX.ts + useX.test.ts (e.g. useFeatureFlag)
│   ├── navigation/              # TODO(init): navigators, linking (Bare), or route helpers (Expo Router)
│   ├── services/                # IO boundary: one folder per backend/domain
│   │   ├── http/                #   httpClient.ts, queryClient.ts, queryKeys.ts, errors.ts, schema.ts (generated)
│   │   ├── auth/                #   session.ts (single-flight refresh), secureStorage.ts (Keychain)
│   │   ├── analytics/           #   Vendor-neutral facade + events catalog
│   │   ├── <domain>Service/     #   fetchX.ts + useX.ts (+ tests)
│   │   └── translation/         #   init.ts, en.json, es.json, pt-BR.json
│   ├── store/                   # Zustand stores
│   │   ├── storage.ts           #   MMKV instance(s)
│   │   ├── helpers.ts           #   createJSONStorageHelper
│   │   ├── registry/            #   Self-registration: reset on logout + devtools list
│   │   └── <name>State/<name>State.ts   # e.g. sessionState, preferencesState, featureFlagsState
│   ├── types/                   # Global .d.ts (i18next resources …)
│   └── utils/                   # Pure helpers, one folder per domain
│       ├── logger/logger.ts     # Logger with pluggable sinks; the only place allowed to call console.*
│       └── testUtils.tsx        # Custom render/renderHook with providers
├── __fixtures__/                # Test data (alias @fixtures/*)
├── __mocks__/                   # Jest mocks for native modules
├── scripts/                     # Node scripts: env-check.ts, ci/ (Trivy report, sticky PR comment) …
├── patches/                     # pnpm patchedDependencies (one file per patched lib)
└── .github/
    ├── workflows/ci.yaml        # PR checks
    ├── workflows/security-scan.yaml   # Weekly dependency scan → tracking issue
    ├── pull_request_template.md
    └── dependabot.yml
```

**Expo Router note:** files in `app/` define routes only. Each route file re-exports the screen from `src/features/<feature>/<Screen>/<Screen>.tsx`, so feature code stays in `src/` and stays testable.

## Placement rules

1. **Is it used by more than one feature?** If yes, put it in `src/components/` or `src/hooks/`. If no, put it in `src/features/<feature>/…`.
2. **Is it used by more than one screen of the feature?** If yes, use `features/<feature>/components|hooks/`. If no, nest it in `<ScreenName>/components|hooks/`.
3. **Does it do IO?** Network calls go in `src/services/<domain>Service/`. Components and features consume them through hooks and never import `axios` directly.
4. **Navigation wiring** lives in `src/navigation/` (or `app/` for Expo Router). Features export screens, and the navigation layer imports them.
5. **Tests are colocated** with the file under test. Snapshots go in a sibling `__snapshots__/`.
6. **No `index.ts` barrels anywhere** (see [03](03-coding-conventions.md#modules--imports)).
