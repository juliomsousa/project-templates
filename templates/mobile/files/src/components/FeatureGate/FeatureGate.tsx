import {type ReactNode} from 'react'
import {useFeatureFlag} from '@app/hooks/useFeatureFlag/useFeatureFlag'
import {type FeatureFlag} from '@app/store/featureFlagsState/featureFlagsState'

interface FeatureGateProps {
  flag: FeatureFlag
  children: ReactNode
  fallback?: ReactNode
}

export const FeatureGate = ({flag, children, fallback = null}: FeatureGateProps) =>
  useFeatureFlag(flag) ? children : fallback
