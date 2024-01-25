import {shared_config as sharedConfig} from '../common/shared_config';
import {event, container} from 'codeceptjs';

const LATEST_MAC = 'macOS 10.15';
const LATEST_WINDOWS = 'Windows 10';

const setupConfig = {
  name: 'cross-browser',
  tests: '../functional/*_test.ts',
  output: '../../../../functional-output/cross-browser/reports',
  include: sharedConfig.include,
  helpers: sharedConfig.helpers,
  plugins: sharedConfig.plugins,
  multiple: {
    cross_browser: {
      browsers: [
        {
          browser: 'webkit',
          capabilities: {
            platformName: LATEST_MAC,
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Mac_webkit_latest',
              screenResolution: '1400x1050',
            },
          }
        },
        {
          browser: 'chromium',
          capabilities: {
            platformName: LATEST_WINDOWS,
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Win_chromium_latest',
            },          
          }
        },
        {
          browser: 'chromium',
          capabilities: {
            platformName: LATEST_MAC,
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Mac_chromium_latest',
            },          
          }
        },
        {
          browser: 'firefox',
          capabilities: {
            platformName: LATEST_WINDOWS,
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Win_Firefox_latest',
            },          
          }
        },
        {
          browser: 'firefox',
          capabilities: {
            platformName: LATEST_MAC,
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Mac_Firefox_latest',
            },          
          }
        },
      ]    
    }
  },
};

// This renames the tests for each browser so they can be displayed in the report
event.dispatcher.on(event.test.before, function (test) {
  const {Playwright} = container.helpers();
  test.title = test.title + ' - ' + Playwright.options.capabilities['sauce:options'].name;
});

exports.config = setupConfig;
