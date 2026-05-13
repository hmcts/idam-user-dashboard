import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  outputDir: 'functional-output/functional/reports',
  reporter: [
    ['list'],
    ['./src/test/playwright/reporters/detailed-allure-reporter.js', {
      resultsDir: 'functional-output/functional/allure-results',
      suiteTitle: false,
      collapseSingleProjectSuites: true,
    }],
  ],
});
