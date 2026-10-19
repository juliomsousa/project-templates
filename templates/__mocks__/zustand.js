// Official Zustand testing recipe: every store created in a test is reset to its
// initial state after each test, so tests never leak state into each other.
// https://zustand.docs.pmnd.rs/guides/testing
import {act} from '@testing-library/react-native'

const {create: actualCreate} = jest.requireActual('zustand')

const storeResetFns = new Set()

const createUncurried = createState => {
  const store = actualCreate(createState)
  const initialState = store.getInitialState()
  storeResetFns.add(() => store.setState(initialState, true))
  return store
}

export const create = createState =>
  typeof createState === 'function' ? createUncurried(createState) : createUncurried

afterEach(() => {
  act(() => {
    storeResetFns.forEach(resetFn => resetFn())
  })
})
