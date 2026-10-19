// Stores register themselves here when their module loads. One place to reset
// user data on logout, and one list for the Zustand devtools.
export type StoreScope =
  /** User data: reset on logout */
  | 'session'
  /** Device preferences (locale, onboarding …): kept across logouts */
  | 'device'

export interface InspectableStore {
  getState: () => object
  subscribe: (listener: () => void) => () => void
}

export interface RegisteredStore {
  name: string
  scope: StoreScope
  store: InspectableStore
  reset: () => void
  /** Hide from devtools (stores holding tokens or secrets) */
  inspect?: boolean
}

const stores = new Map<string, RegisteredStore>()

export const registerStore = (entry: RegisteredStore) => {
  stores.set(entry.name, entry)
}

export const getRegisteredStores = () => [...stores.values()]

export const resetSessionStores = () =>
  stores.forEach(({scope, reset}) => {
    if (scope === 'session') reset()
  })
