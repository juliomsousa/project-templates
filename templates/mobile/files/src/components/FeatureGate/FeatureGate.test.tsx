import {Text} from 'react-native'
import {act, screen} from '@testing-library/react-native'
import {useFeatureFlagsState} from '@app/store/featureFlagsState/featureFlagsState'
import {render} from '@app/utils/testUtils'
import {FeatureGate} from './FeatureGate'

describe('Given a feature gate', () => {
  describe('When the flag is off', () => {
    it('should render the fallback', () => {
      render(
        <FeatureGate fallback={<Text>Old screen</Text>} flag="newProfileScreen">
          <Text>New screen</Text>
        </FeatureGate>
      )

      expect(screen.getByText('Old screen')).toBeOnTheScreen()
      expect(screen.queryByText('New screen')).not.toBeOnTheScreen()
    })
  })

  describe('When the flag is turned on', () => {
    it('should render the feature', () => {
      render(
        <FeatureGate flag="newProfileScreen">
          <Text>New screen</Text>
        </FeatureGate>
      )

      act(() => useFeatureFlagsState.getState().setFlags({newProfileScreen: true}))

      expect(screen.getByText('New screen')).toBeOnTheScreen()
    })
  })
})
