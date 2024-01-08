export const config: CodeceptJS.MainConfig = {
  tests: './*_test.ts',
  output: '../../../functional-output/functional/reports',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: process.env.TEST_URL || 'https://idam-user-dashboard.aat.platform.hmcts.net/',
      show: false
    },
    REST: {
      endpoint: "https://idam-testing-support-api.aat.platform.hmcts.net",
      timeout: 30000
    },
    Testing_support: {
      require: './helpers/testing_support_helper.ts',
    },
  },
  include: {
    I: './steps_file',
    setupDAO: './dao/SetupDao.ts'
  },
  plugins: {
    allure: {
      enabled: true,
      require: '@codeceptjs/allure-legacy'
    }
  },
  name: 'best-practice'
};