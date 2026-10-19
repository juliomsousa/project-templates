import {fireEvent, screen} from '@testing-library/react-native'
import {PROFILE_CARD} from '@app/constants/locators'
import {render} from '@app/utils/testUtils'
import {ProfileCard} from './ProfileCard'

describe('Given a profile card', () => {
  const onPress = jest.fn()
  const defaultProps = {
    title: 'Your profile',
    description: 'Name, email and preferences',
    onPress
  }

  describe('When it is rendered', () => {
    it.each(['default', 'warning'] as const)(
      'should match the snapshot for the %s variant',
      variant => {
        const {toJSON} = render(<ProfileCard {...defaultProps} variant={variant} />)

        expect(toJSON()).toMatchSnapshot()
      }
    )

    it('should show the title as a header and the description', () => {
      render(<ProfileCard {...defaultProps} />)

      expect(screen.getByRole('header', {name: 'Your profile'})).toBeOnTheScreen()
      expect(screen.getByText('Name, email and preferences')).toBeOnTheScreen()
    })
  })

  describe('When the user presses it', () => {
    it('should call onPress once', () => {
      render(<ProfileCard {...defaultProps} />)

      fireEvent.press(screen.getByTestId(PROFILE_CARD))

      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })
})
