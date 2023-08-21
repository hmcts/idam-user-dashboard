import {config as testConfig} from '../config';
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
  name: 'cross-browser',
  tests: '../functional/*-test.ts',
  output: '../../../functional-output/cross-browser/reports',
  helpers: {
    ...testConfig.helpers,
    Playwright: {
      url: testConfig.TEST_URL,
      waitForTimeout: 60002,
      waitForAction: 800,
      timeout: 20004,
      waitForNavigation: 'domcontentloaded',
      ignoreHTTPSErrors: true,
      capabilities: {},
    },
  },
  plugins: testConfig.plugins,
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
