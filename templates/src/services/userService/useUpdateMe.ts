import {useMutation, useQueryClient} from '@tanstack/react-query'
import {queryKeys} from '@app/services/http/queryKeys'
import {updateMe} from './updateMe'

export const useUpdateMe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMe,
    onSuccess: user => queryClient.setQueryData(queryKeys.user.me(), user)
  })
}
