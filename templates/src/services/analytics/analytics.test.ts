import {
  setAnalyticsAdapter,
  setAnalyticsEnabled,
  trackEvent,
  trackScreen,
  type AnalyticsAdapter
} from './analytics'
import {ANALYTICS_EVENTS} from './events'

const createAdapter = (): jest.Mocked<AnalyticsAdapter> => ({
  trackScreen: jest.fn(),
  trackEvent: jest.fn(),
  setUserId: jest.fn(),
  setEnabled: jest.fn()
})

describe('Given the analytics facade', () => {
  afterEach(() => {
    setAnalyticsEnabled(false)
    setAnalyticsAdapter()
  })

  describe('When the user has not consented', () => {
    it('should not send anything to the vendor', () => {
      const adapter = createAdapter()
      setAnalyticsAdapter(adapter)

      trackEvent(ANALYTICS_EVENTS.profileSaved)

      expect(adapter.trackEvent).not.toHaveBeenCalled()
    })
  })

  describe('When the user consents', () => {
    it('should enable the vendor and forward screens and events', () => {
      const adapter = createAdapter()
      setAnalyticsAdapter(adapter)

      setAnalyticsEnabled(true)
      trackScreen('Profile')
      trackEvent(ANALYTICS_EVENTS.profileSaved, {fields: 2})

      expect(adapter.setEnabled).toHaveBeenLastCalledWith(true)
      expect(adapter.trackScreen).toHaveBeenCalledWith('Profile', undefined)
      expect(adapter.trackEvent).toHaveBeenCalledWith('profile_saved', {fields: 2})
    })
  })
})
