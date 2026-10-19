import {useEffect} from 'react'
import {QueryClientProvider} from '@tanstack/react-query'
import i18n from 'i18next'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import './theme'
import {ErrorBoundary} from '@app/components/ErrorBoundary/ErrorBoundary'
import {useDevTools} from '@app/devtools/useDevTools'
import {setAnalyticsEnabled} from '@app/services/analytics/analytics'
import {
  queryClient,
  subscribeToAppFocus
} from '@app/services/http/queryClient'
import {initI18n} from '@app/services/translation/init'
import {usePreferencesState} from '@app/store/preferencesState/preferencesState'

export const App = () => {
  const locale = usePreferencesState(state => state.locale)
  const isAnalyticsAccepted = usePreferencesState(
    state => state.isAnalyticsAccepted
  )

  useDevTools()

  useEffect(() => {
    if (i18n.isInitialized) {
      i18n.changeLanguage(locale)
    } else {
      initI18n(locale)
    }
  }, [locale])

  useEffect(() => {
    setAnalyticsEnabled(isAnalyticsAccepted === true)
  }, [isAnalyticsAccepted])

  useEffect(subscribeToAppFocus, [])

  // TODO(planning): register the auth refresher (setTokenRefresher), the analytics
  // adapter (setAnalyticsAdapter) and the monitoring log sink (addLogSink) at startup.
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          {/* TODO(init): navigation container + root navigator / Expo Router */}
          {null}
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
