import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock'
import {initI18n} from '@app/services/translation/init'

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext)

beforeAll(async () => {
  await initI18n('en')
})
