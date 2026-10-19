// Validates .env.<variant> against the Zod schema before the app starts or builds.
// Runs on Node ≥ 24 (native TypeScript type stripping): `node scripts/env-check.ts`
const variant = process.env.APP_VARIANT ?? 'dev'
process.loadEnvFile(`.env.${variant}`)

await import('../src/env.ts')

process.stdout.write(`✔ .env.${variant} is valid\n`)

export {}
