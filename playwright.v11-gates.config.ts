import { defineConfig } from '@playwright/test'

// v11 hardened audit gates against the deployed STAGING site. Heavier than the deploy-gauntlet
// smoke (seeds/cleans DB rows + storage, needs the Management token). Kept OUT of the deploy
// gauntlet — the gauntlet's playwright staging config `testIgnore`s v11-gates.spec.ts — so prod
// promotion stays fast and doesn't need these secrets. Run by .github/workflows/staging-gates.yml.
//
// Run locally:
//   STAGING_URL=https://staging.<project>.predivo.ch \
//   STAGING_HTPASSWD_USER=staging STAGING_HTPASSWD_PASS=... \
//   <PROJECT>_MGMT_TOKEN=sbp_... <PROJECT>_SVC_KEY=sb_secret_... \
//   npx playwright test --config playwright.v11-gates.config.ts
const STAGING_URL = process.env.STAGING_URL ?? 'https://staging.CHANGEME.predivo.ch' // TODO(v11): set default

export default defineConfig({
  testDir: './e2e/staging',
  testMatch: 'v11-gates.spec.ts',
  timeout: 240_000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: STAGING_URL,
    headless: true,
    screenshot: 'only-on-failure',
    httpCredentials:
      process.env.STAGING_HTPASSWD_USER && process.env.STAGING_HTPASSWD_PASS
        ? { username: process.env.STAGING_HTPASSWD_USER, password: process.env.STAGING_HTPASSWD_PASS }
        : undefined,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
