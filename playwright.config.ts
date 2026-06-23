import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// E2E config for the MyStreet admin + marketing web app.
// Run: `npm run test:e2e` (starts the Next dev server automatically).
// Per-task flows live in e2e/tasks/WEB-XXX.spec.ts and are the e2e gate in
// /build-task. Webhook/service-role flows use server route handlers, never the
// browser session.

// Load .env.local (gitignored) without adding a dotenv dependency, so contract
// specs (e.g. WEB-005) can read NEXT_PUBLIC_SUPABASE_* without hardcoding keys.
const envFile = resolve(__dirname, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Start the app for the test run unless E2E_BASE_URL points at an already-running
  // instance. `npm run dev` is fine for e2e; CI can switch to build+start.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
        url: BASE_URL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
