import { config as testConfig } from '../config';

export const config: CodeceptJS.Config = {
  tests: './*-test.ts',
  output: '../../../test-output/functional/reports',
  helpers: testConfig.helpers,
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
