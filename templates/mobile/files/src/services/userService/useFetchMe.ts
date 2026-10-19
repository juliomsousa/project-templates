import {useQuery} from '@tanstack/react-query'
import {queryKeys} from '@app/services/http/queryKeys'
import {fetchMe} from './fetchMe'

export const useFetchMe = () =>
  useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: ({signal}) => fetchMe(signal)
  })
