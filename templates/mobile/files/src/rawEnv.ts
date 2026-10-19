// Reads raw values from process.env. Shared by the app bundle and scripts/env-check.ts,
// so it must not import anything from react-native.
//
// TODO(init):
// - Bare: values are inlined at build time by babel `transform-inline-environment-variables`
//   (see babel.config.js). Keep the names as below.
// - Expo: client variables must be EXPO_PUBLIC_* and accessed statically,
//   e.g. `API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL`.
export const rawEnv = {
  APP_VARIANT: process.env.APP_VARIANT,
  API_BASE_URL: process.env.API_BASE_URL,
  LOG_LEVEL: process.env.LOG_LEVEL
}
