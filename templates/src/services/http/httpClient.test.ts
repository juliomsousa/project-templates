import AxiosMockAdapter from 'axios-mock-adapter'
import {userFixture} from '@fixtures/user'
import {useSessionState} from '@app/store/sessionState/sessionState'
import {ApiError, NetworkError} from './errors'
import {buildUrl, callApi, httpClient} from './httpClient'

const mockHttp = new AxiosMockAdapter(httpClient)

describe('Given the HTTP client', () => {
  afterEach(() => {
    mockHttp.reset()
    useSessionState.getState().reset()
  })

  describe('When building a URL with path params', () => {
    it('should replace and encode every placeholder', () => {
      expect(buildUrl('/users/{userId}/notes', {userId: 'a b'})).toBe(
        '/users/a%20b/notes'
      )
    })
  })

  describe('When the user has an access token', () => {
    it('should send it as a bearer token', async () => {
      useSessionState.getState().setTokens({
        accessToken: 'token-123',
        refreshToken: 'refresh-1',
        expiresAt: Date.now() + 60 * 60_000
      })
      mockHttp.onGet('/users/me').reply(config => [
        config.headers?.Authorization === 'Bearer token-123' ? 200 : 401,
        userFixture
      ])

      await expect(callApi('/users/me', {method: 'get'})).resolves.toEqual(
        userFixture
      )
    })
  })

  describe('When the server responds with an error', () => {
    it('should throw an ApiError with the status and code', async () => {
      mockHttp.onGet('/users/me').reply(404, {code: 'USER_NOT_FOUND'})

      await expect(
        callApi('/users/me', {method: 'get', skipErrorLog: true})
      ).rejects.toMatchObject({
        name: ApiError.name,
        status: 404,
        code: 'USER_NOT_FOUND'
      })
    })
  })

  describe('When there is no response', () => {
    it('should throw a NetworkError', async () => {
      mockHttp.onGet('/users/me').networkError()

      await expect(
        callApi('/users/me', {method: 'get', skipErrorLog: true})
      ).rejects.toBeInstanceOf(NetworkError)
    })
  })
})
