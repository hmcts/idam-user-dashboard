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
  FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET:process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET,
  FUNCTIONAL_TEST_SERVICE_CLIENT_ID : 'idam-functional-test-service',
  RBAC: {
    access: 'idam-user-dashboard--access'
  },
  TestHeadlessBrowser: process.env.TEST_HEADLESS ? process.env.TEST_HEADLESS === 'true' : true,
  WaitForTimeout: 60008,
  helpers: {},
  plugins: {
    retryFailedStep: {
      enabled: false,
      retries: 1,
    },
    autoDelay: {
      enabled: true
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
    waitForTimeout: 60001,
    waitForAction: 500,
    timeout: 20002,
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

