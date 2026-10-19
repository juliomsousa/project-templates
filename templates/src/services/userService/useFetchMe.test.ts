import {waitFor} from '@testing-library/react-native'
import {userFixture} from '@fixtures/user'
import {ApiError} from '@app/services/http/errors'
import {renderHook} from '@app/utils/testUtils'
import * as fetchMeModule from './fetchMe'
import {useFetchMe} from './useFetchMe'

describe('Given a hook to fetch the current user', () => {
  describe('When the request succeeds', () => {
    it('should return the user', async () => {
      jest.spyOn(fetchMeModule, 'fetchMe').mockResolvedValue(userFixture)

      const {result} = renderHook(() => useFetchMe())

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(userFixture)
    })
  })

  describe('When the request fails', () => {
    it('should expose the API error', async () => {
      const error = new ApiError('GET /users/me failed with 500', {status: 500})
      jest.spyOn(fetchMeModule, 'fetchMe').mockRejectedValue(error)

      const {result} = renderHook(() => useFetchMe())

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBe(error)
    })
  })
})
