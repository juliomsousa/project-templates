import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import {
  DEFAULT_LOCALE,
  type SupportedLocale
} from '@app/services/translation/init'
import {createJSONStorageHelper} from '../helpers'
import {registerStore} from '../registry/storeRegistry'
import {storage} from '../storage'

interface PreferencesData {
  locale: SupportedLocale
  hasCompletedOnboarding: boolean
  /** null = not asked yet */
  isAnalyticsAccepted: boolean | null
}

interface PreferencesState extends PreferencesData {
  setLocale: (locale: SupportedLocale) => void
  completeOnboarding: () => void
  setAnalyticsAccepted: (accepted: boolean) => void
  reset: () => void
}

export const PREFERENCES_INITIAL_STATE: PreferencesData = {
  locale: DEFAULT_LOCALE,
  hasCompletedOnboarding: false,
  isAnalyticsAccepted: null
}

export const usePreferencesState = create<PreferencesState>()(
  persist(
    set => ({
      ...PREFERENCES_INITIAL_STATE,
      setLocale: locale => set({locale}),
      completeOnboarding: () => set({hasCompletedOnboarding: true}),
      setAnalyticsAccepted: isAnalyticsAccepted => set({isAnalyticsAccepted}),
      reset: () => set(PREFERENCES_INITIAL_STATE)
    }),
    {
      name: 'preferences',
      version: 1,
      storage: createJSONStorageHelper(storage),
      // Persist data only, never actions
      partialize: ({locale, hasCompletedOnboarding, isAnalyticsAccepted}) => ({
        locale,
        hasCompletedOnboarding,
        isAnalyticsAccepted
      })
    }
  )
)

registerStore({
  name: 'preferences',
  scope: 'device',
  store: usePreferencesState,
  reset: usePreferencesState.getState().reset
})
