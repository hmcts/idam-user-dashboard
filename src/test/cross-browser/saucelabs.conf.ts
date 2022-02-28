import {config} from '../config';
import supportedBrowsers from './supportedBrowsers';
import {event, container} from 'codeceptjs';

const waitForTimeout = 60000;
const smartWait = 5000;

const defaultSauceOptions = {
  username: process.env.SAUCE_USERNAME,
  accessKey: process.env.SAUCE_ACCESS_KEY,
  acceptSslCerts: true,
  extendedDebugging: true,
  capturePerformance: true,
};

const getBrowserConfig = browserGroup => {
  const browserConfig: any[] = [];

  for (const candidateBrowser in supportedBrowsers[browserGroup]) {
    if (candidateBrowser) {
      const candidateCapabilities = {
        ...{'sauce:options': defaultSauceOptions},
        ...supportedBrowsers[browserGroup][candidateBrowser]
      };

      browserConfig.push({
        browser: candidateCapabilities.browserName,
        capabilities: candidateCapabilities,
      });
    } else {
      console.error('ERROR: supportedBrowsers.js is empty or incorrectly defined');
    }
  }

  return browserConfig;
};

const setupConfig = {
  tests: '../functional/*-test.ts',
  name: 'cross-browser',
  output: '../../../test-output/cross-browser/reports',
  helpers: {
    Playwright: {
      url: config.TEST_URL,
      browser: 'chromium',
      waitForTimeout,
      smartWait,
      cssSelectorsEnabled: 'true',
      host: 'ondemand.eu-central-1.saucelabs.com',
      port: 80,
      capabilities: {},
    },
    FeatureFlagHelper: {
      require: '../functional/shared/helpers/featureFlagHelper.ts'
    },
  },
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 2,
    },
    autoDelay: {
      enabled: true,
      delayAfter: 2000,
    },
    allure: {
      enabled: true,
    },
  },
  include: {
    I: '../functional/custom-steps.ts',
  },
  multiple: {
    webkit: {
      browsers: getBrowserConfig('webkit'),
    },
    chromium: {
      browsers: getBrowserConfig('chromium'),
    },
    firefox: {
      browsers: getBrowserConfig('firefox'),
    },
  },
};

event.dispatcher.on(event.test.before, function (test) {
  const {Playwright} = container.helpers();
  test.title = test.title + ' - ' + Playwright.options.capabilities['sauce:options'].name;
});

exports.config = setupConfig;
