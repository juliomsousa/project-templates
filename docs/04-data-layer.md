# 04 — Data layer

```
Component ──▶ useFetchMe()  ──▶ fetchMe()  ──▶ callApi('/users/me', {method: 'get'})  ──▶ axios
             (TanStack Query)    (fetcher)       (typed from OpenAPI, auth, errors, logging)
```

Rules:

1. **Components never import `axios`.** ESLint `no-restricted-imports` blocks it outside `src/services/http/`.
2. **One fetcher and one hook per endpoint**, in `src/services/<domain>Service/`.
3. **API types are generated, not hand-written:** `pnpm api:types` runs `openapi-typescript` against the backend spec and writes `src/services/http/schema.ts`.
4. **Query keys come from one factory** (`queryKeys.ts`), never from inline arrays.
5. **Errors are typed classes** that carry metadata only, never payloads.

Files in `templates/src/services/`:

| File | Role |
|---|---|
| `http/schema.ts` | Generated OpenAPI types (an example is included) |
| `http/types.ts` | Derives `MethodOf`, `ResponseOf`, `RequestBodyOf` and `RequestOptions` from the schema |
| `http/httpClient.ts` | axios instance + `callApi`: auth header, `{param}` substitution, error mapping, logging |
| `http/errors.ts` | `ApiError`, `NetworkError`, type guards |
| `http/queryClient.ts` | QueryClient defaults (no retry on 4xx), app-focus refetch |
| `http/queryKeys.ts` | Hierarchical key factory |
| `userService/*` | Example fetchers and hooks: query, mutation, path + query params |
| `auth/session.ts` | `getValidAccessToken` (single-flight refresh), `startSession`, `endSession` |
| `auth/secureStorage.ts` | Persists session tokens in the Keychain |

## Typed `callApi`

The endpoint string is checked against the generated schema. The method, path params, query, body and response type all follow from it:

```ts
await callApi('/users/me', {method: 'get'})                        // → Promise<User>
await callApi('/users/me', {method: 'patch', body: {name: 'Ana'}}) // body typed as UpdateUser
await callApi('/users/{userId}/notes', {
  method: 'get',
  params: {userId},   // replaces {userId}, URL-encoded
  query: {page: 2}
})

// Compile errors:
callApi('/users/me', {method: 'post'})                    // method not in spec
callApi('/users/{userId}/notes', {method: 'get', params: {id: 'x'}})
callApi('/users/me', {method: 'get', body: {name: 'a'}})  // GET has no body
```

These cases were checked with `tsc` against the template types.

## Fetcher + query hook

```ts
// services/userService/fetchMe.ts
export type User = ResponseOf<'/users/me', 'get'>

export const fetchMe = (signal?: AbortSignal) =>
  callApi('/users/me', {method: 'get', signal})
```

```ts
// services/userService/useFetchMe.ts
export const useFetchMe = () =>
  useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: ({signal}) => fetchMe(signal)  // cancels the request when the query is cancelled
  })
```

## Mutation

```ts
// services/userService/updateMe.ts
export type UpdateMeBody = RequestBodyOf<'/users/me', 'patch'>

export const updateMe = (body: UpdateMeBody) =>
  callApi('/users/me', {method: 'patch', body})

// services/userService/useUpdateMe.ts
export const useUpdateMe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMe,
    onSuccess: user => queryClient.setQueryData(queryKeys.user.me(), user)
  })
}
```

Use `setQueryData` when the response contains the updated entity. Otherwise use `invalidateQueries({queryKey: queryKeys.user.all})`.

## Query keys

```ts
const USER = ['user'] as const

export const queryKeys = {
  user: {
    all: USER,                                       // invalidate the whole domain
    me: () => [...USER, 'me'] as const,
    notes: (userId: string, page = 1) => [...USER, userId, 'notes', {page}] as const
  }
}
```

## Errors

```ts
export class ApiError extends Error {
  readonly status: number
  readonly code?: string       // backend error code, parsed with Zod (unknown body → no code)
  readonly requestId?: string  // correlate with backend logs
}
export class NetworkError extends Error {}  // no response: offline, timeout, aborted

isApiError(error) / isClientError(error) / isUnauthorizedError(error)
```

- `callApi` turns every axios failure into one of these classes, so callers never handle `AxiosError`.
- Request and response payloads are **never** stored on the error, because errors end up in logs and monitoring and payloads may contain personal data.
- Domain-specific errors extend `ApiError` and live in a `errors.ts` next to the code that throws them.
- Failures are logged once, centrally, in `callApi`. Cancelled, aborted and offline requests are not logged, and a single call can opt out with `skipErrorLog: true`.

## Query client defaults

- `retry`: up to 2 retries, but **never for 4xx** responses, since a retry will not change the outcome.
- `staleTime`: 60 s by default. Override it per query when the data changes more or less often.
- Mutations are not retried.
- `subscribeToAppFocus()` refetches stale queries when the app returns to the foreground.
- **To decide in planning:** an online manager (NetInfo or `expo-network`), and whether the cache is persisted to disk.

## Authentication & token refresh

`callApi` asks `getValidAccessToken()` (`services/auth/session.ts`) for a token before every request.

- If the token expires within **30 s** (`EXPIRY_BUFFER_MS`), it is refreshed **before** the request, so a request never leaves with a token that expires in flight.
- **Single-flight:** when several requests find the token expiring at the same moment, they share **one** refresh call instead of each starting their own. Concurrent refreshes would race, and many providers invalidate the old refresh token after its first use.
  ```ts
  let refreshInFlight: Promise<string> | undefined

  refreshInFlight ??= tokenRefresher(tokens.refreshToken)
    .then(async next => { await startSession(next); return next.accessToken })
    .catch(async error => { await endSession(); throw error })
    .finally(() => { refreshInFlight = undefined })

  return refreshInFlight
  ```
- If the refresh fails, the session ends: session-scoped stores reset and Keychain tokens are cleared. The navigation layer then sends the user to sign-in.
- **The auth provider plugs in** with `setTokenRefresher(refreshToken => …)` at startup (TODO(planning)). The refresh request must not go through `callApi`, because it is itself unauthenticated, and going through `callApi` would loop.
- `startSession(tokens)` after login and `endSession()` on logout are the only ways to change the session. Never write tokens to the store directly.
