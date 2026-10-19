// `import type` (not an inline `type` specifier) guarantees the import is erased at build time
import type {paths} from './schema'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type Endpoint = keyof paths

/** Methods actually defined for an endpoint (the generator marks the rest as `never`) */
export type MethodOf<E extends Endpoint> = {
  [M in HttpMethod]: [NonNullable<paths[E][M & keyof paths[E]]>] extends [never]
    ? never
    : M
}[HttpMethod]

type Operation<E extends Endpoint, M extends MethodOf<E>> = NonNullable<
  paths[E][M & keyof paths[E]]
>

type JsonOf<T> = T extends {content: {'application/json': infer C}} ? C : void

type SuccessOf<Op> = Op extends {responses: infer R}
  ? 200 extends keyof R
    ? JsonOf<R[200 & keyof R]>
    : 201 extends keyof R
      ? JsonOf<R[201 & keyof R]>
      : void
  : never

type ParametersOf<Op> = Op extends {parameters: infer P} ? P : never

type PathParamsOf<Op> =
  ParametersOf<Op> extends {path?: infer P} ? NonNullable<P> : never

type QueryOf<Op> =
  ParametersOf<Op> extends {query?: infer Q} ? NonNullable<Q> : never

type BodyOf<Op> = Op extends {requestBody?: infer B}
  ? [NonNullable<B>] extends [never]
    ? never
    : NonNullable<B> extends {content: {'application/json': infer C}}
      ? C
      : never
  : never

export type ResponseOf<E extends Endpoint, M extends MethodOf<E>> = SuccessOf<
  Operation<E, M>
>

export type RequestBodyOf<E extends Endpoint, M extends MethodOf<E>> = BodyOf<
  Operation<E, M>
>

// M is inferred from `method` only (NoInfer), so params/query/body are checked
// strictly against that method instead of widening the inference.
export interface RequestOptions<E extends Endpoint, M extends MethodOf<E>> {
  method: M
  params?: PathParamsOf<Operation<E, NoInfer<M>>>
  query?: QueryOf<Operation<E, NoInfer<M>>>
  body?: BodyOf<Operation<E, NoInfer<M>>>
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Do not report this failure to the logger (expected errors, polling …) */
  skipErrorLog?: boolean
}
