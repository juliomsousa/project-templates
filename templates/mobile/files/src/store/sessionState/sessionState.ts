import {create} from 'zustand'
import {registerStore} from '../registry/storeRegistry'

export interface SessionTokens {
  accessToken: string
  refreshToken: string
  /** Epoch ms */
  expiresAt: number
}

// Tokens are kept in memory here and persisted with services/auth/secureStorage (Keychain).
// Never persist this store to MMKV.
interface SessionState {
  tokens?: SessionTokens
  setTokens: (tokens?: SessionTokens) => void
  reset: () => void
}

export const SESSION_INITIAL_STATE = {tokens: undefined}

export const useSessionState = create<SessionState>()(set => ({
  ...SESSION_INITIAL_STATE,
  setTokens: tokens => set({tokens}),
  reset: () => set(SESSION_INITIAL_STATE)
}))

registerStore({
  name: 'session',
  scope: 'session',
  store: useSessionState,
  reset: useSessionState.getState().reset,
  inspect: false
})
