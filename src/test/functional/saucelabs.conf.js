const supportedBrowsers = require('../config/supportedBrowsers');

const waitForTimeout = 60000;
const smartWait = 5000;

const defaultSauceOptions = {
  username: 'ashwinivenkatesha',
  accessKey: 'c3425692-b94e-4159-9888-0d0a6c5b4361',
  acceptSslCerts: true,
  extendedDebugging: true,
  capturePerformance: true,
};

const getBrowserConfig = browserGroup => {
  const browserConfig = [];
  for (const candidateBrowser in supportedBrowsers[browserGroup]) {
    if (candidateBrowser) {
      const candidateCapabilities = supportedBrowsers[browserGroup][candidateBrowser];
      candidateCapabilities['sauce:options'] = merge(defaultSauceOptions, candidateCapabilities['sauce:options']);
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

function merge(intoObject, fromObject) {
  return Object.assign({}, intoObject, fromObject);
}

const setupConfig = {
  tests: './src/test/functional/test_test.js',
  output: `${process.cwd()}/functional-output`,
  helpers: {
    WebDriver: {
      url: 'https://www.amazon.co.uk/',
      browser: 'chrome',
      waitForTimeout,
      smartWait,
      cssSelectorsEnabled: 'true',
      host: 'ondemand.eu-central-1.saucelabs.com',
      port: 80,
      capabilities: {},

    },
    SauceLabsReportingHelper: {require: './shared/sauceLabsReportingHelper.js'},
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
  },


  multiple: {
    microsoft: {
      browsers: getBrowserConfig('microsoft'),
    },
    chrome: {
      browsers: getBrowserConfig('chrome'),
    },
    firefox: {
      browsers: getBrowserConfig('firefox'),
    },
  },
  name: 'Idam user dashboard',
};

exports.config = setupConfig;
