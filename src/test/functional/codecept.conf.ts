import {config as testConfig} from '../config';
import {deleteAllTestData} from './shared/apiHelpers';

export const config: CodeceptJS.Config = {
  tests: './*-test.ts',
  output: '../../../functional-output/functional/reports',
  helpers: testConfig.helpers,
  timeout: testConfig.WaitForTimeout,
  include: {
    I: './custom-steps.ts',
  },
  async teardownAll() {
    await deleteAllTestData(testConfig.TEST_SUITE_PREFIX);
  },
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
    }
  },
};
