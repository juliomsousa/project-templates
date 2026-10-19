import {z} from 'zod'
import {rawEnv} from './rawEnv.ts'

// Every variable must exist in: .env.sample, rawEnv.ts and this schema.
const envSchema = z.object({
  APP_VARIANT: z.enum(['dev', 'prd']),
  API_BASE_URL: z
    .url()
    .refine(url => !url.endsWith('/'), 'API_BASE_URL must not end with "/"'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
})

export type Env = z.infer<typeof envSchema>

const parsed = envSchema.safeParse(rawEnv)

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`
  )
}

export const env: Env = parsed.data
