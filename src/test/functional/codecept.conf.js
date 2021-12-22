require('ts-node').register({project: 'src/test/tsconfig.json'});
const config = require('../config');


exports.config = {
  tests: './*_test.ts',
  output: '../../../test-output/functional/reports',
  helpers: {
    Playwright: {
      url: config.config.TEST_URL,
      show: false,
      browser: 'chromium',
    },
  },
  include: {
    I: './steps_file.js',
  },
  bootstrap: null,
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
