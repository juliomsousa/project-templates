import {
  type FeatureFlag,
  useFeatureFlagsState
} from '@app/store/featureFlagsState/featureFlagsState'

export const useFeatureFlag = (flag: FeatureFlag) =>
  useFeatureFlagsState(state => state.flags[flag])
