import {callApi} from '@app/services/http/httpClient'

interface FetchNotesArgs {
  userId: string
  page?: number
  signal?: AbortSignal
}

// Path params replace `{userId}`; query params are serialised by axios
export const fetchNotes = ({userId, page = 1, signal}: FetchNotesArgs) =>
  callApi('/users/{userId}/notes', {
    method: 'get',
    params: {userId},
    query: {page},
    signal
  })
