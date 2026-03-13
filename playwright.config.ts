import { defineConfig, devices } from '@playwright/test';

const normalizeTestUrl = (url: string): string => url.replace(/\/+$/, '');
const baseURL = normalizeTestUrl(process.env.TEST_URL || 'https://idam-user-dashboard.aat.platform.hmcts.net/');

export default defineConfig({
  testDir: './src/test/playwright/specs',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'playwright-report/allure' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    headless: process.env.TEST_HEADLESS ? process.env.TEST_HEADLESS === 'true' : true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
