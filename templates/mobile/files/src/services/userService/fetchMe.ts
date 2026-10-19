import {callApi} from '@app/services/http/httpClient'
import {type ResponseOf} from '@app/services/http/types'

export type User = ResponseOf<'/users/me', 'get'>

export const fetchMe = (signal?: AbortSignal) =>
  callApi('/users/me', {method: 'get', signal})
