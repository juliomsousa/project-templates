import {useSessionState} from '@app/store/sessionState/sessionState'
import * as secureStorage from './secureStorage'
import {getValidAccessToken, setTokenRefresher} from './session'

jest.mock('./secureStorage')

const tokensExpiringIn = (ms: number) => ({
  accessToken: 'access-old',
  refreshToken: 'refresh-1',
  expiresAt: Date.now() + ms
})

describe('Given a session', () => {
  afterEach(() => {
    useSessionState.getState().reset()
    setTokenRefresher()
  })

  describe('When the access token is still valid', () => {
    it('should return it without refreshing', async () => {
      const refresher = jest.fn()
      setTokenRefresher(refresher)
      useSessionState.getState().setTokens(tokensExpiringIn(10 * 60_000))

      await expect(getValidAccessToken()).resolves.toBe('access-old')
      expect(refresher).not.toHaveBeenCalled()
    })
  })

  describe('When several requests find the token about to expire', () => {
    it('should refresh only once and share the new token', async () => {
      const refresher = jest.fn().mockResolvedValue({
        accessToken: 'access-new',
        refreshToken: 'refresh-2',
        expiresAt: Date.now() + 60 * 60_000
      })
      setTokenRefresher(refresher)
      useSessionState.getState().setTokens(tokensExpiringIn(1_000))

      const tokens = await Promise.all([
        getValidAccessToken(),
        getValidAccessToken(),
        getValidAccessToken()
      ])

      expect(tokens).toEqual(['access-new', 'access-new', 'access-new'])
      expect(refresher).toHaveBeenCalledTimes(1)
      expect(secureStorage.saveSessionTokens).toHaveBeenCalledTimes(1)
    })
  })

  describe('When the refresh fails', () => {
    it('should end the session', async () => {
      setTokenRefresher(jest.fn().mockRejectedValue(new Error('invalid_grant')))
      useSessionState.getState().setTokens(tokensExpiringIn(1_000))

      await expect(getValidAccessToken()).rejects.toThrow('invalid_grant')
      expect(useSessionState.getState().tokens).toBeUndefined()
      expect(secureStorage.clearSessionTokens).toHaveBeenCalled()
    })
  })

  describe('When there is no session', () => {
    it('should return no token', async () => {
      await expect(getValidAccessToken()).resolves.toBeUndefined()
    })
  })
})
