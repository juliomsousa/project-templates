import {resetSessionStores} from '@app/store/registry/storeRegistry'
import {
  type SessionTokens,
  useSessionState
} from '@app/store/sessionState/sessionState'
import {logger} from '@app/utils/logger/logger'
import {clearSessionTokens, saveSessionTokens} from './secureStorage'

/** Refresh slightly before expiry so a token never expires mid-request */
export const EXPIRY_BUFFER_MS = 30_000

export const isTokenExpiring = (expiresAt: number, now = Date.now()) =>
  expiresAt - now <= EXPIRY_BUFFER_MS

export type TokenRefresher = (refreshToken: string) => Promise<SessionTokens>

const notConfiguredRefresher: TokenRefresher = async () => {
  throw new Error('No token refresher configured: call setTokenRefresher at startup')
}

let tokenRefresher: TokenRefresher = notConfiguredRefresher

/**
 * TODO(planning): register the chosen auth provider's refresh call at startup.
 * It must not use callApi: the refresh request itself is unauthenticated.
 */
export const setTokenRefresher = (refresher: TokenRefresher = notConfiguredRefresher) => {
  tokenRefresher = refresher
}

export const startSession = async (tokens: SessionTokens) => {
  useSessionState.getState().setTokens(tokens)
  await saveSessionTokens(tokens)
}

export const endSession = async () => {
  resetSessionStores()
  await clearSessionTokens()
}

let refreshInFlight: Promise<string> | undefined

/**
 * Returns a valid access token, refreshing it when it is about to expire.
 * Concurrent callers share a single refresh request (single-flight).
 */
export const getValidAccessToken = async (): Promise<string | undefined> => {
  const {tokens} = useSessionState.getState()
  if (!tokens) return undefined
  if (!isTokenExpiring(tokens.expiresAt)) return tokens.accessToken

  refreshInFlight ??= tokenRefresher(tokens.refreshToken)
    .then(async next => {
      await startSession(next)
      return next.accessToken
    })
    .catch(async (error: unknown) => {
      logger.warn('Token refresh failed, ending session', {
        reason: error instanceof Error ? error.message : String(error)
      })
      await endSession()
      throw error
    })
    .finally(() => {
      refreshInFlight = undefined
    })

  return refreshInFlight
}
