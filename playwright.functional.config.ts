import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  outputDir: 'functional-output/functional/reports',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'functional-output/functional/allure', open: 'never' }],
  ],
});
