import {AppState, Platform} from 'react-native'
import {focusManager, QueryClient} from '@tanstack/react-query'
import {isClientError} from './errors'

const MAX_RETRIES = 2
const DEFAULT_STALE_TIME_MS = 60_000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      // 4xx will not succeed on retry
      retry: (failureCount, error) =>
        !isClientError(error) && failureCount < MAX_RETRIES
    },
    mutations: {retry: false}
  }
})

// Refetch stale queries when the app returns to the foreground
export const subscribeToAppFocus = () => {
  const subscription = AppState.addEventListener('change', status => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active')
  })

  return () => subscription.remove()
}

// TODO(planning): wire onlineManager to NetInfo / expo-network if offline support matters,
// and decide whether the cache is persisted (@tanstack/react-query-persist-client).
