//require('ts-node/register');
require('ts-node').register({ project: 'src/test/tsconfig.json' });

exports.config = {
  tests: './*_test.ts',
  output: '../../../test-output',
  helpers: {
    Playwright: {
      url: 'http://localhost:3100',
      show: true,
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
    tryTo: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
    },
  },
};

