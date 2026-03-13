import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testDir: './src/test/accessibility',
  outputDir: 'functional-output/accessibility-results',
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'functional-output/accessibility/allure-results' }],
  ],
});
