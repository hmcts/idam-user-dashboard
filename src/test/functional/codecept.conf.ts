import { config as testConfig } from '../config';
import { createUserWithRoles, deleteUser } from './shared/apiHelpers';

export const config: CodeceptJS.Config = {
  tests: './*-test.ts',
  output: '../../../test-output/functional/reports',
  helpers: testConfig.helpers,
  timeout: testConfig.WaitForTimeout,
  include: {
    I: './custom-steps.ts',
  },
  async bootstrapAll() {
    for (const user of [testConfig.superUser, testConfig.adminUser, testConfig.civilUser]) {
      await createUserWithRoles(user.email, user.firstName, [user.role]);
    }
  },
  async teardownAll() {
    for (const user of [testConfig.superUser, testConfig.adminUser, testConfig.civilUser]) {
      await deleteUser(user.email);
    }
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
    },
  },
};
