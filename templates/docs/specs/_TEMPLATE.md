# NN — <Title>

**Status:** Draft | Approved | Implemented
**Request:** <link to the issue or the original prompt>

## Overview

What is being built and why, in two or three sentences. Who uses it and what changes for them.

## Current state

The relevant code today: files, flows, limitations. Link file paths.

## Architecture

- Components, hooks, services and stores involved, and how data flows between them.
- New endpoints (`callApi` paths), query keys, stores (scope: session or device), flags, analytics events.
- Navigation changes (routes, params).
- Accessibility and i18n impact (new keys in `en`, `es`, `pt-BR`).

## File structure

```
src/features/<feature>/<Screen>/<Screen>.tsx        (new)
src/features/<feature>/<Screen>/<Screen>.test.tsx   (new)
src/services/<domain>Service/useX.ts                (new)
src/constants/locators.ts                           (edit)
```

## Implementation steps

1. …
2. …

## Tests

| Unit | Scenarios (Given / When / Then) | Type |
|---|---|---|
| `<Screen>` | loading, success, empty, error, retry | snapshot + interaction |
| `useX` | success, API error, network error | hook |

Coverage target: ≥ 90%.

## Out of scope

- …

## Open questions

- [ ] …

## Decisions log

| Date | Decision | Reason |
|---|---|---|
