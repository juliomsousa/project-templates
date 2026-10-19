# 01 — Stack

Rules for versions:

- Use the **latest stable** version at init time.
- Pin with an **exact version** (`"x.y.z"`, no `^`) any library that tends to ship breaking changes in minor or patch releases. These are marked 📌 below.
- Everything else may use `^`. Lockfile-frozen installs (`pnpm i --frozen-lockfile`) keep CI deterministic.

## Fixed

| Concern | Choice | Notes |
|---|---|---|
| Runtime | React Native (latest), React 19, TypeScript strict | Node LTS pinned in `.nvmrc`. Bare: Ruby pinned in `.ruby-version` + Bundler for CocoaPods |
| Package manager | pnpm via corepack (`packageManager` field) | Supply-chain settings in [07](07-workflow-and-constraints.md#supply-chain) |
| Bundler | **Metro** (RN default) | Metro does not tree-shake by default, see [03 › Heavy dependencies](03-coding-conventions.md#heavy-dependencies) |
| Server state | `@tanstack/react-query` | |
| Client state | `zustand` + `persist` middleware | |
| Storage | `react-native-mmkv` (non-sensitive), Keychain/Keystore (sensitive) | Expo: MMKV needs a dev build (not Expo Go). Use `expo-secure-store` for secrets |
| HTTP | `axios` behind a single typed `callApi` | Types generated from OpenAPI (`openapi-typescript`), see [04](04-data-layer.md) |
| Styling | 📌 `react-native-unistyles` **v3** | Exact version. Breaking changes have landed in minors |
| Forms | `react-hook-form` + `@hookform/resolvers` (`standardSchemaResolver`) | |
| Validation | `zod` v4 | env, forms, API payload guards |
| i18n | `i18next` + `react-i18next` | Locales: `en`, `es`, `pt-BR` |
| Dates | `date-fns` + `@date-fns/tz` | Subpath imports only |
| FP helpers | `ramda` (optional) | Only where it reads better than native |
| Utility hooks | `usehooks-ts` | Works on iOS and Android. Use only RN-safe hooks, see below |
| Error boundary | `react-error-boundary` | Wrapped by `components/ErrorBoundary` (logs + translated fallback) |
| SVG | `react-native-svg` + `react-native-svg-transformer` | Imported as components, see [03 › SVG icons](03-coding-conventions.md#svg-icons) |
| Secure storage | `react-native-keychain` (Bare) / `expo-secure-store` (Expo) | Tokens and secrets only |
| Devtools | Rozenite (`@rozenite/metro` + plugins) | See [Devtools](#devtools-rozenite). Replaces Reactotron |
| Unit tests | `jest` + `@testing-library/react-native` | Preset depends on workflow, see [06](06-testing.md) |
| Lint / format | ESLint (flat config) + Prettier + `typescript-eslint` + `eslint-plugin-sonarjs` + `eslint-plugin-import` | |

## Decided per project

Navigation, the monitoring vendor, the analytics vendor, the feature-flag source, the E2E tool, accessibility tooling and security hardening are decided during planning. See the [README](../README.md#decisions-to-make-during-planning). The template already provides vendor-neutral facades for monitoring, analytics and feature flags ([09](09-observability.md), [03 › Feature flags](03-coding-conventions.md#feature-flags)), so choosing a vendor only means writing an adapter.

## `usehooks-ts`

Small utility hooks so the codebase doesn't hand-roll `useState` toggles, timers or debouncing. Its only dependency is `lodash.debounce`.

| Hook | Use for |
|---|---|
| `useBoolean` → `{value, setValue, setTrue, setFalse, toggle}` | Modal, sheet and loading flags |
| `useDebounceCallback(fn, wait)` → debounced fn with `.cancel()` / `.flush()` | Search inputs, autosave |
| `useDebounceValue` | Debouncing a derived value |
| `useInterval`, `useTimeout` | Polling, delayed actions (cleaned up on unmount) |
| `useCounter`, `useToggle`, `useStep` | Simple local state machines |
| `useIsMounted`, `useUnmount`, `useIsomorphicLayoutEffect` | Lifecycle helpers |

Caveat: some hooks depend on browser APIs (`window`, `document`, `localStorage`, `matchMedia`) and **do not work in React Native**. Avoid `useLocalStorage`, `useSessionStorage`, `useMediaQuery`, `useDarkMode`, `useTernaryDarkMode`, `useWindowSize`, `useScreen`, `useScrollLock`, `useEventListener` (window/document targets), `useOnClickOutside`, `useHover`, `useIntersectionObserver`, `useResizeObserver`, `useCopyToClipboard`, `useScript`, `useDocumentTitle` and `useReadLocalStorage`. Use MMKV, Unistyles runtime values or React Native APIs instead.

```ts
import {useBoolean} from 'usehooks-ts'

const {value: isOpen, setTrue: open, setFalse: close} = useBoolean(false)
```

## Devtools (Rozenite)

[Rozenite](https://www.rozenite.dev) adds panels to React Native DevTools. `@rozenite/metro` (`withRozenite` in `metro.config.js`) discovers every installed plugin automatically. The plugin hooks are wired in `src/devtools/useDevTools.ts`, and every plugin is a no-op in production builds.

**Rule: when you install a library, check whether it has a Rozenite plugin and wire it in `useDevTools`.**

| Library | Plugin | Hook |
|---|---|---|
| TanStack Query | `@rozenite/tanstack-query-plugin` | `useTanStackQueryDevTools(queryClient)` |
| MMKV | `@rozenite/mmkv-plugin` | `useMMKVDevTools({storages, blacklist?})` |
| Zustand | `rozenite-zustand-devtools` (community package) | `useZustandDevTools(stores)`, fed from the store registry |
| React Navigation / Expo Router | `@rozenite/react-navigation-plugin` | `useReactNavigationDevTools({ref})` next to the container |
| react-hook-form | `@rozenite/rhf-plugin` | `useRozeniteRHFPlugin({control: form.control, id: '<form-id>'})` inside the form |
| Network (fetch/XHR) | `@rozenite/network-activity-plugin` | `useNetworkActivityDevTools()` |
| Performance | `@rozenite/performance-monitor-plugin` | `usePerformanceMonitorDevTools()` |
| Generic storage (AsyncStorage …) | `@rozenite/storage-plugin` | See the plugin README |
| Expo bundle analysis | `@rozenite/expo-atlas-plugin` | Expo only |

Keep secrets out of devtools: register stores that hold tokens with `inspect: false`, and use the MMKV plugin's `blacklist` for sensitive keys.
