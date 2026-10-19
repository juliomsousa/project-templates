# 06 — Testing

## Setup

| File | Purpose |
|---|---|
| `jest.config.js` | Preset (`@react-native/jest-preset` for Bare, `jest-expo` for Expo), `@app` and `@fixtures` mapping, 90% coverage gate |
| `jest.env.js` | Loads `.env.sample`, so tests never depend on a developer's local `.env.*` |
| `jest.setup.ts` | Global mocks (safe-area) and i18n init |
| `src/utils/testUtils.tsx` | Custom `render` / `renderHook` with providers |
| `__mocks__/` | Native module mocks: in-memory `react-native-mmkv` and `react-native-keychain`, `svgMock.js`, and `zustand.js` (see below) |
| `__fixtures__/` | Typed test data (`userFixture: User`) |

Run with `pnpm test` (uses `TZ=UTC`, so date tests are deterministic) or `pnpm test:coverage`.

`__mocks__/zustand.js` is the official Zustand testing recipe: **every store resets to its initial state after each test**, so tests never leak state into each other.

## Rules

- **Colocate tests:** `X.tsx` sits next to `X.test.tsx`. Snapshots go in a sibling `__snapshots__/`.
- **Always import `render` and `renderHook` from `@app/utils/testUtils`**, never directly from Testing Library. The wrappers provide SafeArea, a **fresh QueryClient per render** (retries off, `gcTime: 0`) and an ErrorBoundary. A custom `queryClient` can be passed in to pre-seed the cache.
- **Prefer snapshot tests over regular unit tests whenever possible.** Snapshot each meaningful render state (loading, success, empty, error) and add explicit assertions only for behaviour a snapshot can't show: presses, callbacks, navigation, store changes.
  ```tsx
  it('should match the snapshot for the warning variant', () => {
    const {toJSON} = render(<ProfileCard {...defaultProps} variant="warning" />)

    expect(toJSON()).toMatchSnapshot()
  })
  ```
  Review every snapshot diff before running `-u`. Never update a snapshot just to make a failing test pass.
- **Naming:** Given / When / Then, written in plain, non-technical language. The test names carry the meaning, so tests have no explanatory comments.
  ```ts
  describe('Given a profile card', () => {
    describe('When the user presses it', () => {
      it('should call onPress once', () => { … })
    })
  })
  ```
- **Group cross-cutting checks** in their own `describe` blocks inside the component's suite: `describe('accessibility', …)` for roles, labels and focus, and `describe('analytics', …)` for tracked screens and events. This keeps them easy to find and hard to forget.
- **Query by role or text first** (`getByRole('header', {name})`, `getByText`). Role queries are weaker in React Native than on the web, so `getByTestId` with constants from `constants/locators.ts` is fine for elements without an accessible name. **The `testID` is mainly the E2E anchor.**
- **Mock at the boundary:**
  - Hooks: `jest.spyOn(fetchModule, 'fetchX')`.
  - HTTP client: `axios-mock-adapter` on `httpClient`.
  - Native modules: `__mocks__/`.
  - Pluggable adapters (analytics, log sink, token refresher): pass a mock through their setter.
  - Don't mock the unit under test's own internals.
- **Typed mocks:** use typed fixtures and `as unknown as T` for partial objects.

### Dates

- **Build fixtures relative to today**, never from a literal date that will eventually fall in the past: `subDays(new Date(), 3)`, `addMonths(new Date(), 1)`.
- Use date-fns (`parseISO`, `format`, `subDays` …), never hand-rolled millisecond arithmetic.
- Mock the payload in the shape the API actually sends (date-only `2026-10-18` vs date-time `2026-10-18T09:00:00Z`), and assert on the value the way the app displays it.
- Tests run with `TZ=UTC`. When behaviour depends on the time zone, test it explicitly with `@date-fns/tz`.
- For "now"-dependent logic, freeze time with `jest.useFakeTimers({now: new Date(...)})` and restore it in `afterEach`.

## Coverage

- A **90% global threshold** on statements, branches, functions and lines fails `pnpm test` (and CI) when it is not met.
- Exclude code only when it is explicit and narrow:
  - `/* istanbul ignore next */` above each `StyleSheet.create`.
  - `/* istanbul ignore file */` only for pure wiring with no logic (storage instances, navigation type files).
  - `__fixtures__/`, `__mocks__/` and `*.d.ts` are excluded in `jest.config.js`.

## Examples in `templates/`

- `components/ProfileCard/ProfileCard.test.tsx`: component, roles, press handler.
- `components/ErrorBoundary/ErrorBoundary.test.tsx`: error logging, fallback, retry.
- `components/FeatureGate/FeatureGate.test.tsx`: flag off and flag on.
- `services/userService/useFetchMe.test.ts`: query hook success and error paths.
- `services/http/httpClient.test.ts`: auth header, URL building, `ApiError` and `NetworkError` mapping.
- `services/auth/session.test.ts`: single-flight refresh, failed refresh ends the session.
- `services/analytics/analytics.test.ts`, `utils/logger/logger.test.ts`, `store/registry/storeRegistry.test.ts`.

## E2E

> The **tool** is TBD (Maestro, Detox …). These conventions apply whichever tool is chosen.

**Structure**

- E2E lives in its own folder and package (`e2e/`), with its own lint and typecheck. It is excluded from the app's lint, typecheck and Jest runs.
- **Page objects (or flow helpers for Maestro)** per screen. They own the locators and the assertions (`expectProfileVisible()`). Test files read as user journeys and contain no raw selectors and no `expect` calls.
- **Shared constants:** locators come from the app's `src/constants/locators.ts` and route names from `src/constants/screens.ts`. These are the only imports from `src/` that E2E may use.

**Writing tests**

- **Locator priority:** testID (from `locators.ts`), then accessibility label, then visible text. Never use coordinates, index-based selectors or XPath.
- **No fixed sleeps.** Wait for an element or a state, with a timeout.
- **Independent tests:** each test sets up its own state (seeded account, deep link, API fixture) and restores anything it changes. Order must not matter.
- **Tags** in the test name or metadata: `@smoke` (runs on every PR or build), `@regression` (nightly or release), `@a11y`. Add a test-case ID tag if a test management tool is used.
- **Languages:** key journeys run in `en`, `es` and `pt-BR`. Expected copy comes from the translation files, never from strings duplicated in the test.

**Hygiene and safety**

- **Accessibility checks per screen** (`@a11y`):
  - every pressable has a role and a label
  - there is one header per screen
  - focus order follows the visual order
  - the same elements exist in every locale

  Exceptions that are intended are listed in a table in the E2E README with a reason. Never weaken a check silently.
- **Redact failure artefacts.** Logs, network captures and screenshots attached to reports must have tokens, JWTs, `Authorization` headers, query strings and long IDs stripped before upload.
- **Test accounts and token tooling** live apart from the specs (e.g. `e2e/tools/`). Credentials come from CI secrets, never from the repo.
- Unused page-object methods and locators are deleted, not left behind.
