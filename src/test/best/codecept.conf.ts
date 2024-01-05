export const config: CodeceptJS.MainConfig = {
  tests: './*_test.ts',
  output: './output',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: process.env.TEST_URL || 'https://idam-user-dashboard.aat.platform.hmcts.net/',
      show: false
    }
  },
  include: {
    I: './steps_file'
  },
  name: 'best-practice'
};