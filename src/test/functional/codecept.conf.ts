import { config as testConfig } from '../config';

export const config: CodeceptJS.Config = {
  //tests: './*-test.ts',
  tests:'./manage-users-test.ts',
  output: '../../../test-output/functional/reports',
  //helpers: testConfig.helpers,
  helpers:{
    Playwright: {
      url: testConfig.TEST_URL,
      show: true,
      browser: 'chromium',
      waitForTimeout: testConfig.WaitForTimeout,
      waitForAction: 1000,
      waitForNavigation: 'networkidle0',
      ignoreHTTPSErrors: true,
    },
    IdamHelper: {
      require: './shared/idam-helper.ts',
    },
  },
  timeout: testConfig.WaitForTimeout,
  include: {
    I: './custom-steps.js',
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
