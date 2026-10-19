import {useMemo} from 'react'
import {useMMKVDevTools} from '@rozenite/mmkv-plugin'
import {useTanStackQueryDevTools} from '@rozenite/tanstack-query-plugin'
import {useZustandDevTools} from 'rozenite-zustand-devtools'
import {queryClient} from '@app/services/http/queryClient'
import {getRegisteredStores} from '@app/store/registry/storeRegistry'
import {storage} from '@app/store/storage'

/**
 * Rozenite devtools. Every plugin is a no-op in production builds.
 * When a library with a Rozenite plugin is added, wire it here
 * (see docs/01-stack.md › Devtools).
 * TODO(init): React Navigation → useReactNavigationDevTools({ref}) next to the navigation container.
 */
export const useDevTools = () => {
  const zustandStores = useMemo(
    () =>
      getRegisteredStores()
        .filter(({inspect}) => inspect !== false)
        .map(({name, store}) => ({name, store})),
    []
  )

  useTanStackQueryDevTools(queryClient)
  useMMKVDevTools({storages: [storage]})
  useZustandDevTools(zustandStores)
}
