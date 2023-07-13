import {config as testConfig} from '../config';
import {deleteAllTestData} from './shared/testingSupportApi';

export const config: CodeceptJS.Config = {
  name: 'functional',
  tests: './*-test.ts',
  output: '../../../functional-output/functional/reports',
  helpers: testConfig.helpers,
  timeout: 60,
  include: {
    I: './custom-steps.ts',
  },
  async teardownAll() {
    await deleteAllTestData(testConfig.TEST_SUITE_PREFIX);
  },
  mocha: {},
  plugins: testConfig.plugins,
};
