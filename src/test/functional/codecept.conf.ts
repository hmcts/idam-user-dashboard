import {config as testConfig} from '../config';

export const config: CodeceptJS.Config = {
  name: 'functional',
  tests: './gen-test.ts',
  output: '../../../functional-output/functional/reports',
  helpers: testConfig.helpers,
  timeout: 59000,
  include: {
    I: './custom-steps.ts',
  },
  mocha: {},
  plugins: testConfig.plugins,
};
