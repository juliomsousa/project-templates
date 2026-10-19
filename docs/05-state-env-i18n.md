# 05 — State, environment & i18n

## Client state: Zustand

- Store files live at `src/store/<name>State/<name>State.ts` and export `use<Name>State`.
- The state interface declares data **and** actions together. Create stores with `create<State>()((set, get) => …)`.
- Zustand holds client and session state only. Server data stays in TanStack Query: never copy query results into a store.
- Outside React (e.g. in `callApi`), read a store with `useXState.getState()`.
- Components select the slice they need (`usePreferencesState(state => state.locale)`) to avoid re-renders.

- **Every store exports `<NAME>_INITIAL_STATE` and a `reset()` action**, and **registers itself** in `store/registry/storeRegistry.ts` with a scope:
  - `session`: user data, reset on logout by `resetSessionStores()` (called from `endSession`).
  - `device`: preferences that survive logout (locale, onboarding, consent).

  Because each store registers itself, nobody maintains a hand-written list of stores to reset. The registry also feeds the Zustand devtools. Stores holding secrets register with `inspect: false`.

```ts
export const PREFERENCES_INITIAL_STATE: PreferencesData = {
  locale: DEFAULT_LOCALE,
  hasCompletedOnboarding: false,
  isAnalyticsAccepted: null
}

export const usePreferencesState = create<PreferencesState>()(
  persist(
    set => ({
      ...PREFERENCES_INITIAL_STATE,
      setLocale: locale => set({locale}),
      completeOnboarding: () => set({hasCompletedOnboarding: true}),
      setAnalyticsAccepted: isAnalyticsAccepted => set({isAnalyticsAccepted}),
      reset: () => set(PREFERENCES_INITIAL_STATE)
    }),
    {
      name: 'preferences',
      version: 1,                                  // bump + `migrate` on shape changes
      storage: createJSONStorageHelper(storage),   // MMKV
      partialize: ({locale, hasCompletedOnboarding, isAnalyticsAccepted}) => ({
        locale, hasCompletedOnboarding, isAnalyticsAccepted
      })
    }
  )
)

registerStore({
  name: 'preferences',
  scope: 'device',
  store: usePreferencesState,
  reset: usePreferencesState.getState().reset
})
```

### Storage

| Data | Where |
|---|---|
| Preferences, flags, non-sensitive cache | MMKV (`store/storage.ts`) through Zustand `persist` |
| Tokens, credentials, anything sensitive | Keychain/Keystore: `react-native-keychain` (Bare) or `expo-secure-store` (Expo), through `services/auth/secureStorage.ts` |

### Secure storage & biometrics

- Store items with `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY`: readable only while the device is unlocked, and never restored to another device from a backup.
- Use a separate `service` name per item (`app.session`, `app.biometricCredentials`), so one item can be cleared without touching the others.
- **Biometric unlock:** store the item with `ACCESS_CONTROL.BIOMETRY_CURRENT_SET`. The OS then asks for Face ID / fingerprint on read, and **invalidates the item if the enrolled biometrics change** (e.g. someone adds a fingerprint):
  ```ts
  await Keychain.setGenericPassword('biometric', refreshToken, {
    service: 'app.biometricCredentials',
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET
  })

  const credentials = await Keychain.getGenericPassword({
    service: 'app.biometricCredentials',
    authenticationPrompt: {title: t('auth.biometrics.promptTitle')}
  })
  ```
  Check `Keychain.getSupportedBiometryType()` before offering the option. If the user cancels or the item has been invalidated, fall back to the regular sign-in.
- Never put secrets in MMKV, env vars, logs, analytics or navigation params.
- On logout, call `endSession()`. It clears the Keychain items as well as the in-memory stores.

## Environment variables

Three files must stay in sync. The `env:validate` script fails fast when they don't:

1. **`.env.sample`**: committed, documents every variable with a safe example value.
2. **`src/rawEnv.ts`**: reads `process.env` with no React Native imports, because it also runs in Node.
3. **`src/env.ts`**: Zod schema plus `env` export. The app throws at startup on invalid config, with a readable error from `z.prettifyError`.

```ts
const envSchema = z.object({
  APP_VARIANT: z.enum(['dev', 'prd']),
  API_BASE_URL: z.url().refine(url => !url.endsWith('/'), 'API_BASE_URL must not end with "/"'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
})
```

`pnpm env:validate` (`scripts/env-check.ts`, run natively by Node ≥ 24) loads `.env.<variant>`, imports `src/env.ts` and exits non-zero on failure. Every `start`, `android`, `ios` and CI job runs it first.

Real `.env.*` files are gitignored. Never put secrets in client env vars: anything in the bundle can be extracted from the app.

### Variants: `dev` and `prd` only

How values are injected depends on the init workflow:

| | Bare RN CLI | Expo |
|---|---|---|
| Env files | `.env.dev`, `.env.prd` | `.env.dev`, `.env.prd` (or EAS environment variables) |
| Injection | `babel-plugin-transform-inline-environment-variables`, loaded in `babel.config.js` (template) | Built in: client vars are prefixed `EXPO_PUBLIC_` |
| App identity | Android `productFlavors` (`dev` with `applicationIdSuffix ".dev"`, `prd`) + iOS schemes/configurations (`<App>-Dev`, `<App>`) | `app.config.ts` reading `APP_VARIANT` (bundle id, name, icon) + EAS build profiles |
| Selecting a variant | `APP_VARIANT=prd pnpm start` + flavor/scheme | `APP_VARIANT=prd eas build --profile production` |

Follow the chosen workflow's own conventions for anything beyond this table.

## i18n

- Libraries: `i18next` + `react-i18next`. Resources are bundled JSON in `src/services/translation/`: `en.json`, `es.json`, `pt-BR.json`.
- `en` is the source of truth and the fallback. Keys are typed (`types/i18next.d.ts`), so `t('profile.unknown')` is a compile error.
- Key format: a top-level namespace object, then dot-notation keys inside it:
  ```json
  {"profile": {"edit.save": "Save changes", "form.nameRequired": "Enter your name"}}
  ```
- Never hard-code user-facing strings, including accessibility labels and Zod error messages (store the i18n key and translate it at render time).
- **Zod's built-in messages follow the app language:** `init.ts` calls `z.config(z.locales.<locale>())` on every `languageChanged` (Zod 4 ships `en`, `es` and `ptBR`). Custom messages in schemas are still i18n keys:
  ```ts
  z.object({name: z.string().min(1, 'profile.form.nameRequired')})  // custom → t(key)
  z.object({age: z.number()})  // built-in "expected number" → translated by Zod
  ```
- Device locale detection is done with `react-native-localize` (Bare) or `expo-localization` (Expo). The user's choice is persisted in `preferencesState`.
- Optional, if the project needs it: remote translations (an `i18next-http-backend` layer over the bundled resources) plus a script that compares local and remote keys.
