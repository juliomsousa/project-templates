// Event and screen names live here, never as inline strings in features.
export const ANALYTICS_EVENTS = {
  profileSaved: 'profile_saved',
  logout: 'logout'
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]
