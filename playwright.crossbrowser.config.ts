import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  outputDir: 'functional-output/cross-browser/reports',
  reporter: [
    ['list'],
    ['./src/test/playwright/reporters/detailed-allure-reporter.js', { resultsDir: 'functional-output/cross-browser/allure-results' }],
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
