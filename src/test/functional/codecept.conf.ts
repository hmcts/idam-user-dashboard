import { config as testConfig, testAccounts } from '../config';
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
    for(const { email, password, firstName, role } of Object.values(testAccounts)) {
      await createUserWithRoles(email, password, firstName, [role]);
    }
  },
  async teardownAll() {
    for (const { email } of Object.values(testAccounts)) {
      await deleteUser(email);
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
