import { config as TestConfig } from '../config';

export const config: CodeceptJS.Config = {
  tests: './*-test.ts',
  output: '../../../test-output/functional/reports',
  helpers: {
    Playwright: {
      url: TestConfig.TEST_URL,
      show: false,
      browser: 'chromium',
    },
  },
  include: {
    I: './steps_file.js',
  },
  bootstrap: null,
  mocha: {},
  name: 'functional',
  plugins: {
    pauseOnFail: {},
    retryFailedStep: {
      enabled: true,
    },
    allure: {
      enabled: true,
    },
    tryTo: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
    },
  },
};
