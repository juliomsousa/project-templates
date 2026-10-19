// Vendor-neutral analytics facade. Features call trackScreen/trackEvent only;
// the vendor is plugged in with setAnalyticsAdapter (TODO(planning): choose the vendor).
export type AnalyticsParams = Record<string, string | number | boolean | undefined>

export interface AnalyticsAdapter {
  trackScreen: (screenName: string, params?: AnalyticsParams) => void
  trackEvent: (eventName: string, params?: AnalyticsParams) => void
  setUserId?: (userId?: string) => void
  /** Called when consent changes; the adapter must stop collecting when false */
  setEnabled: (enabled: boolean) => void
}

const noopAdapter: AnalyticsAdapter = {
  trackScreen: () => undefined,
  trackEvent: () => undefined,
  setEnabled: () => undefined
}

let adapter: AnalyticsAdapter = noopAdapter
let isEnabled = false

export const setAnalyticsAdapter = (next: AnalyticsAdapter = noopAdapter) => {
  adapter = next
  adapter.setEnabled(isEnabled)
}

/** Driven by the user's consent */
export const setAnalyticsEnabled = (enabled: boolean) => {
  isEnabled = enabled
  adapter.setEnabled(enabled)
}

export const trackScreen = (screenName: string, params?: AnalyticsParams) => {
  if (isEnabled) adapter.trackScreen(screenName, params)
}

export const trackEvent = (eventName: string, params?: AnalyticsParams) => {
  if (isEnabled) adapter.trackEvent(eventName, params)
}

export const setAnalyticsUserId = (userId?: string) => {
  if (isEnabled) adapter.setUserId?.(userId)
}
