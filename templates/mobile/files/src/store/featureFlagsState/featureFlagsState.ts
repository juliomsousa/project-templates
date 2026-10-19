import {create} from 'zustand'
import {registerStore} from '../registry/storeRegistry'

// Every flag is declared here with its default (used until the source answers).
export const FEATURE_FLAG_DEFAULTS = {
  newProfileScreen: false,
  notesSearch: false
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAG_DEFAULTS
export type FeatureFlags = Record<FeatureFlag, boolean>

interface FeatureFlagsState {
  flags: FeatureFlags
  /** Merge values from the source (TODO(planning): remote config tool, login payload …) */
  setFlags: (flags: Partial<FeatureFlags>) => void
  reset: () => void
}

export const useFeatureFlagsState = create<FeatureFlagsState>()(set => ({
  flags: {...FEATURE_FLAG_DEFAULTS},
  setFlags: flags => set(state => ({flags: {...state.flags, ...flags}})),
  reset: () => set({flags: {...FEATURE_FLAG_DEFAULTS}})
}))

registerStore({
  name: 'featureFlags',
  scope: 'session',
  store: useFeatureFlagsState,
  reset: useFeatureFlagsState.getState().reset
})
