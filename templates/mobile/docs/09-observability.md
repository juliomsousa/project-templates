# 09 — Observability: logging, monitoring, analytics, errors

The **vendors** are decided per project (see the README's planning table). The **facades** are fixed. Features only ever call the facades, so switching vendor means writing one adapter, not touching features.

## Logger (`utils/logger/logger.ts`)

```ts
logger.info('Profile saved', {fields: 2})
logger.error('Payment failed', {code: error.code, requestId: error.requestId})
logger.setAttribute('userId', user.id)   // global context for every later log
```

- **Sinks:** in dev the console sink is active. In production there is no sink until the monitoring adapter is registered with `addLogSink(sink)` at startup. A sink implements `log(level, message, context)` and optionally `setAttribute(key, value)`.
- `LOG_LEVEL` (env) filters by level before anything reaches the sinks.
- This is the only file allowed to use `console.*` (ESLint `no-console`).
- **Never log** tokens, credentials, request or response bodies, or personal data. Log IDs and codes instead (`requestId`, error `code`, status).

### Monitoring adapter (TODO(planning))

```ts
// services/monitoring/<vendor>Sink.ts
export const vendorSink: LogSink = {
  log: (level, message, context) =>
    level === 'error' ? Vendor.addError(message, context) : Vendor.addAction(message, context),
  setAttribute: (key, value) => Vendor.setAttribute(key, value)
}

addLogSink(vendorSink)   // in App startup, after the SDK is initialised
```

- **Correlation:** if the vendor exposes a session ID, add it as a header in `callApi` (e.g. `x-session-id`) so backend logs can be matched with app sessions.
- Upload source maps (JS) and dSYMs/mapping files (native) from the release pipeline, so production stack traces are readable.

## Analytics (`services/analytics/`)

```ts
import {trackEvent, trackScreen} from '@app/services/analytics/analytics'
import {ANALYTICS_EVENTS} from '@app/services/analytics/events'

trackScreen('ProfileDetails')
trackEvent(ANALYTICS_EVENTS.profileSaved, {fields: 2})
```

- **Adapter:** the default is a no-op. Register the vendor with `setAnalyticsAdapter(adapter)` at startup. An adapter implements `trackScreen`, `trackEvent`, `setEnabled` and optionally `setUserId`.
- **Consent:** nothing is sent until the user accepts. `App.tsx` syncs `preferencesState.isAnalyticsAccepted` to `setAnalyticsEnabled`. `null` means not asked yet, which counts as disabled. The adapter must stop collecting when it is disabled.
- **Event catalogue:** event names live in `events.ts`, never inline. Params are flat primitives with no personal data.
- **Tests:** pass a `jest.fn()` adapter to `setAnalyticsAdapter` and assert inside a `describe('analytics', …)` block ([06](06-testing.md)).

## Error boundaries

`components/ErrorBoundary` wraps `react-error-boundary`. It logs every render error through `logger.error` and shows a translated fallback with a retry button. It is used at the app root and around independent screen sections ([03 › Error boundaries](03-coding-conventions.md#error-boundaries)).

## HTTP errors

`callApi` logs each failed request once, centrally, with method, URL, status and code. Cancelled, aborted and offline requests are not logged, and `skipErrorLog: true` silences an expected failure ([04](04-data-layer.md#errors)).
