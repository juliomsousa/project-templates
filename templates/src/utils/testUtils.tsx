import {type PropsWithChildren, type ReactElement} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions
} from '@testing-library/react-native'
import {ErrorBoundary} from 'react-error-boundary'
import {SafeAreaProvider} from 'react-native-safe-area-context'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: 0},
      mutations: {retry: false}
    }
  })

const TestErrorFallback = () => null

// A fresh QueryClient per render keeps tests isolated from each other's cache.
// TODO(init): wrap children in the navigation container of the chosen navigation library.
const createProviders = (queryClient = createTestQueryClient()) =>
  function Providers({children}: PropsWithChildren) {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary FallbackComponent={TestErrorFallback}>
            {children}
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    )
  }

interface CustomRenderOptions extends RenderOptions {
  queryClient?: QueryClient
}

const customRender = (
  ui: ReactElement,
  {queryClient, ...options}: CustomRenderOptions = {}
) => render(ui, {wrapper: createProviders(queryClient), ...options})

interface CustomRenderHookOptions<Props> extends RenderHookOptions<Props> {
  queryClient?: QueryClient
}

const customRenderHook = <Result, Props>(
  hook: (props: Props) => Result,
  {queryClient, ...options}: CustomRenderHookOptions<Props> = {}
) => renderHook(hook, {wrapper: createProviders(queryClient), ...options})

export {
  createTestQueryClient,
  customRender as render,
  customRenderHook as renderHook
}
