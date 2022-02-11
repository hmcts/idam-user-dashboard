export const config = {
  TEST_URL: process.env.TEST_URL || 'http://localhost:3100',
  SMOKE_TEST_USER_USERNAME: process.env.SMOKE_TEST_USER_USERNAME,
  SMOKE_TEST_USER_PASSWORD: process.env.SMOKE_TEST_USER_PASSWORD,
  USER_FIRSTNAME:'firstName',
  PASSWORD: 'Pa55word11',
  USER_ROLE_CITIZEN: 'citizen',
  SSO_PROVIDER: 'HMCTS-SSO',
  SCENARIO_RETRY_LIMIT: 3,
  TestHeadlessBrowser: process.env.TEST_HEADLESS ? process.env.TEST_HEADLESS === 'true' : true,
  WaitForTimeout: 20000,
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

export const testAccounts = {
  superUser: {
    email: 'superuser@test.com',
    role: 'IDAM_SUPER_USER'
  },
  adminUser: {
    email: 'adminuser@test.com',
    role: 'IDAM_ADMIN_USER'
  },
  citizenUser: {
    email: 'citizenuser@test.com',
    role: 'citizen'
  }
};
