export const config = {
  TEST_URL: process.env.TEST_URL || 'http://localhost:3100',
  SMOKE_TEST_USER_USERNAME: process.env.SMOKE_TEST_USER_USERNAME,
  SMOKE_TEST_USER_PASSWORD: process.env.SMOKE_TEST_USER_PASSWORD,
  TEST_SUITE_PREFIX: 'TEST_IDAM_',
  USER_FIRSTNAME: 'TEST_IDAM_USER_FIRSTNAME',
  USER_LASTNAME: 'TEST_IDAM_USER_LASTNAME',
  PASSWORD: 'Pa55word11',
  USER_ROLE_CITIZEN: 'citizen',
  USER_ROLE_IDAM_MFA_DISABLED: 'idam-mfa-disabled',
  SSO_ID: 'abcde000-0000-0000-0000-000000000000',
  SSO_PROVIDER: 'TEST_HMCTS_SSO',
  SCENARIO_RETRY_LIMIT: 3,
  NOTIFY_API_KEY: process.env.NOTIFY_API_KEY,
  RBAC: {
    access: 'idam-user-dashboard--access'
  },
  TestHeadlessBrowser: process.env.TEST_HEADLESS ? process.env.TEST_HEADLESS === 'true' : true,
  WaitForTimeout: 80000,
  helpers: {},
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 3,
    },
    autoDelay: {
      enabled: true,
      delayAfter: 3000
    },
    retryTo: {
      enabled: true
    },
    allure: {
      enabled: true,
      require: '@codeceptjs/allure-legacy'
    },
  }
};

config.helpers = {
  Playwright: {
    url: config.TEST_URL,
    show: !config.TestHeadlessBrowser,
    browser: 'chromium',
    timeout: '30000',
    waitForTimeout: config.WaitForTimeout,
    waitForAction: 350,
    waitForNavigation: 'networkidle0',
    ignoreHTTPSErrors: true,
  },
  TestingSupportApiHelper: {
    require: '../functional/shared/helpers/testingSupportApiHelper.ts',
  },
  FeatureFlagHelper: {
    require: '../functional/shared/helpers/featureFlagHelper.ts'
  }
};

