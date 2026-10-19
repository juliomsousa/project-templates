/**
 * EXAMPLE of `openapi-typescript` output. Do not edit by hand.
 * Regenerate from the backend spec: `pnpm api:types`
 */
export interface paths {
  '/users/me': {
    parameters: {query?: never; header?: never; path?: never; cookie?: never}
    get: operations['getMe']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['updateMe']
    trace?: never
  }
  '/users/{userId}/notes': {
    parameters: {query?: never; header?: never; path?: never; cookie?: never}
    get: operations['listNotes']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}

export interface components {
  schemas: {
    User: {id: string; name: string; email: string; locale?: string}
    UpdateUser: {name?: string; locale?: string}
    Note: {id: string; text: string; createdAt: string}
  }
}

export interface operations {
  getMe: {
    parameters: {query?: never; header?: never; path?: never; cookie?: never}
    requestBody?: never
    responses: {
      200: {
        headers: {[name: string]: unknown}
        content: {'application/json': components['schemas']['User']}
      }
      401: {headers: {[name: string]: unknown}; content?: never}
    }
  }
  updateMe: {
    parameters: {query?: never; header?: never; path?: never; cookie?: never}
    requestBody: {
      content: {'application/json': components['schemas']['UpdateUser']}
    }
    responses: {
      200: {
        headers: {[name: string]: unknown}
        content: {'application/json': components['schemas']['User']}
      }
    }
  }
  listNotes: {
    parameters: {
      query?: {page?: number; pageSize?: number}
      header?: never
      path: {userId: string}
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {[name: string]: unknown}
        content: {'application/json': components['schemas']['Note'][]}
      }
    }
  }
}
