import {shared_config as sharedConfig} from '../common/shared_config';
import {event, container} from 'codeceptjs';

const setupConfig = {
  name: 'cross-browser',
  tests: '../functional/*_test.ts',
  output: '../../../../functional-output/functional/reports',
  include: sharedConfig.include,
  helpers: sharedConfig.helpers,
  plugins: sharedConfig.plugins,
  multiple: {
    cross_browser: {
      browsers: [
        {
          browser: 'firefox',
          capabilities: {
            platformName: 'macOS 10.15',
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Mac_Firefox_latest',
            },          
          }
        },
        {
          browser: 'chromium',
          capabilities: {
            platformName: 'macOS 10.15',
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Mac_chromium_latest',
            },          
          }
        },
        {
          browser: 'chromium',
          capabilities: {
            platformName: 'Windows 10',
            browserVersion: 'latest',
            'sauce:options': {
              name: 'Win_chromium_latest',
            },          
          }
        }
      ]    
    }
  },
};

event.dispatcher.on(event.test.before, function (test) {
  const {Playwright} = container.helpers();
  test.title = test.title + ' - ' + Playwright.options.capabilities['sauce:options'].name;
});

exports.config = setupConfig;
