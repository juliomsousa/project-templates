import {callApi} from '@app/services/http/httpClient'
import {type RequestBodyOf} from '@app/services/http/types'

export type UpdateMeBody = RequestBodyOf<'/users/me', 'patch'>

export const updateMe = (body: UpdateMeBody) =>
  callApi('/users/me', {method: 'patch', body})
