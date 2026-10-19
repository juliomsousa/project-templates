import {Text} from 'react-native'
import {fireEvent, screen} from '@testing-library/react-native'
import {ERROR_BOUNDARY_RETRY} from '@app/constants/locators'
import {render} from '@app/utils/testUtils'
import * as loggerModule from '@app/utils/logger/logger'
import {ErrorBoundary} from './ErrorBoundary'

let shouldThrow = true

const Unstable = () => {
  if (shouldThrow) throw new Error('Boom')
  return <Text>Recovered</Text>
}

describe('Given an error boundary', () => {
  beforeEach(() => {
    shouldThrow = true
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  describe('When a child throws while rendering', () => {
    it('should log the error and show the translated fallback', () => {
      const error = jest.spyOn(loggerModule.logger, 'error')

      render(
        <ErrorBoundary>
          <Unstable />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong. Please try again.')).toBeOnTheScreen()
      expect(error).toHaveBeenCalledWith('Unhandled render error', expect.objectContaining({message: 'Boom'}))
    })
  })

  describe('When the user presses retry after the problem is gone', () => {
    it('should render the children again', () => {
      const onReset = jest.fn()
      render(
        <ErrorBoundary onReset={onReset}>
          <Unstable />
        </ErrorBoundary>
      )

      shouldThrow = false
      fireEvent.press(screen.getByTestId(ERROR_BOUNDARY_RETRY))

      expect(screen.getByText('Recovered')).toBeOnTheScreen()
      expect(onReset).toHaveBeenCalled()
    })
  })
})
