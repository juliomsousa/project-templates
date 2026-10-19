import {Platform} from 'react-native'
import axios, {AxiosError, type AxiosRequestConfig} from 'axios'
import {env} from '@app/env'
import {getValidAccessToken} from '@app/services/auth/session'
import {logger} from '@app/utils/logger/logger'
import {ApiError, NetworkError} from './errors'
import {
  type Endpoint,
  type MethodOf,
  type RequestOptions,
  type ResponseOf
} from './types'

const REQUEST_TIMEOUT_MS = 20_000

const SKIPPED_LOG_CODES = new Set<string | undefined>([
  AxiosError.ERR_CANCELED,
  AxiosError.ECONNABORTED,
  AxiosError.ERR_NETWORK
])

export const httpClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Cache-Control': 'no-cache',
    'x-app-platform': Platform.OS
  }
})

export const buildUrl = (endpoint: string, params: unknown) =>
  Object.entries((params ?? {}) as Record<string, string | number>).reduce(
    (url, [key, value]) =>
      url.replace(`{${key}}`, encodeURIComponent(String(value))),
    endpoint
  )

const toAppError = (error: unknown, skipErrorLog = false): unknown => {
  if (!(error instanceof AxiosError)) return error

  if (!skipErrorLog && !SKIPPED_LOG_CODES.has(error.code)) {
    logger.error('HTTP request failed', {
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      code: error.code
    })
  }

  return error.response
    ? ApiError.fromResponse(error.response)
    : new NetworkError(error.message, {cause: error})
}

/**
 * The single entry point for HTTP calls. Endpoint, method, params, query, body
 * and response are all typed from the generated OpenAPI schema.
 */
export async function callApi<E extends Endpoint, M extends MethodOf<E>>(
  endpoint: E,
  options: RequestOptions<E, M>
): Promise<ResponseOf<E, M>> {
  const accessToken = await getValidAccessToken()

  const config: AxiosRequestConfig = {
    url: buildUrl(endpoint, options.params),
    method: options.method,
    params: options.query,
    data: options.body,
    signal: options.signal,
    headers: {
      ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
      ...options.headers
    }
  }

  try {
    const {data} = await httpClient.request<ResponseOf<E, M>>(config)

    return data
  } catch (error) {
    throw toAppError(error, options.skipErrorLog)
  }
}
