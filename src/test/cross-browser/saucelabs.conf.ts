import {config} from '../config';
import supportedBrowsers from './supportedBrowsers';
import {event, container} from 'codeceptjs';

const getBrowserConfig = browserGroup => {
  const browserConfig: any[] = [];

  for (const candidateBrowser in supportedBrowsers[browserGroup]) {
    if (candidateBrowser) {
      const candidateCapabilities = {
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
  output: '../../../functional-output/cross-browser/reports',
  helpers: {
    ...config.helpers,
    Playwright: {
      url: config.TEST_URL,
      waitForTimeout: config.WaitForTimeout,
      waitForAction: 1500,
      waitForNavigation: 'domcontentloaded',
      ignoreHTTPSErrors: true,
      capabilities: {},
    },
  },
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 2,
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
