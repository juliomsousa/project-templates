import {create} from 'zustand'
import {getRegisteredStores, registerStore, resetSessionStores} from './storeRegistry'

const createCounterStore = () =>
  create<{count: number; reset: () => void}>()(set => ({
    count: 5,
    reset: () => set({count: 0})
  }))

describe('Given the store registry', () => {
  describe('When the session is reset', () => {
    it('should reset session stores and keep device stores', () => {
      const sessionStore = createCounterStore()
      const deviceStore = createCounterStore()
      registerStore({name: 'session-test', scope: 'session', store: sessionStore, reset: sessionStore.getState().reset})
      registerStore({name: 'device-test', scope: 'device', store: deviceStore, reset: deviceStore.getState().reset})

      resetSessionStores()

      expect(sessionStore.getState().count).toBe(0)
      expect(deviceStore.getState().count).toBe(5)
    })
  })

  describe('When a store registers twice with the same name', () => {
    it('should keep a single entry', () => {
      const store = createCounterStore()
      registerStore({name: 'dup', scope: 'device', store, reset: store.getState().reset})
      registerStore({name: 'dup', scope: 'device', store, reset: store.getState().reset})

      expect(getRegisteredStores().filter(({name}) => name === 'dup')).toHaveLength(1)
    })
  })
})
