import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const ZAKLAD = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: ZAKLAD, trace: 'on-first-retry' },
  // Většina návštěv přijde z telefonu — mobil je proto výchozí prostředí testu.
  projects: [
    { name: 'mobil', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `pnpm exec next start --port ${PORT}`,
    url: ZAKLAD,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
