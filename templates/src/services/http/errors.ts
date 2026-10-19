import {type AxiosResponse} from 'axios'
import {z} from 'zod'

const errorBodySchema = z.object({
  message: z.string().optional(),
  code: z.string().optional()
})

interface ApiErrorDetails {
  status: number
  code?: string
  requestId?: string
}

/**
 * Failed HTTP response. Keeps only non-sensitive metadata: never store the
 * request/response payload on the error (it ends up in logs and monitoring).
 */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly requestId?: string

  constructor(message: string, {status, code, requestId}: ApiErrorDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }

  static fromResponse(response: AxiosResponse): ApiError {
    const body = errorBodySchema.safeParse(response.data)
    const code = body.success ? body.data.code : undefined
    const detail = body.success && body.data.message ? `: ${body.data.message}` : ''

    return new ApiError(
      `${response.config.method?.toUpperCase()} ${response.config.url} failed with ${response.status}${detail}`,
      {
        status: response.status,
        code,
        requestId: response.headers?.['x-request-id']
      }
    )
  }
}

/** No response received: offline, timeout or aborted */
export class NetworkError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'NetworkError'
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError

export const isClientError = (error: unknown): boolean =>
  isApiError(error) && error.status >= 400 && error.status < 500

export const isUnauthorizedError = (error: unknown): boolean =>
  isApiError(error) && error.status === 401
