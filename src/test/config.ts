export const config = {
  TEST_URL: process.env.TEST_URL || 'http://localhost:3100',
  SMOKE_TEST_USER_USERNAME: process.env.SMOKE_TEST_USER_USERNAME,
  SMOKE_TEST_USER_PASSWORD: process.env.SMOKE_TEST_USER_PASSWORD,
  PASSWORD: 'Pa55word11',
  SCENARIO_RETRY_LIMIT: 3,
  TestHeadlessBrowser: process.env.TEST_HEADLESS ? process.env.TEST_HEADLESS === 'true' : true,
  WaitForTimeout: 20000,
  SUPER_USER_FIRSTNAME:'superTest',
  SUPER_USER_EMAIL:'superuser@test.com',
  ADMIN_USER_FIRSTNAME:'adminTest',
  ADMIN_USER_EMAIL:'adminuser@test.com',
  SUPER_USER_ROLE:'IDAM_SUPER_USER',
  ADMIN_USER_ROLE:'IDAM_ADMIN_USER',
  SUPER_ADMIN_CITIZEN_USER_LASTNAME: 'User',
  Gherkin: {
    features: './features/**/*.feature',
    steps: './steps/**/*.ts',
  },
  helpers: {},
};

config.helpers = {
  Playwright: {
    url: config.TEST_URL,
    show: !config.TestHeadlessBrowser,
    browser: 'chromium',
    waitForTimeout: config.WaitForTimeout,
    waitForAction: 1000,
    waitForNavigation: 'networkidle0',
    ignoreHTTPSErrors: true,
  },
  IdamHelper: {
    require: '../functional/shared/idam-helper.ts',
  },
};
