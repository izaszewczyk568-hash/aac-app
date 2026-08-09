import { defineConfig, devices } from '@playwright/test'

const appBase = process.env.VITE_BASE_PATH ?? '/'
const previewUrl = `http://127.0.0.1:4175${appBase}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: previewUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4175',
    url: previewUrl,
    reuseExistingServer: !process.env.CI,
  },
})
