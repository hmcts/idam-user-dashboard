import {fail} from 'assert';
import Axios from 'axios';
import {config} from '../config';
const TestData = require('../test_data');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pa11y = require('pa11y');
const axios = Axios.create({baseURL: config.TEST_URL});

class Pa11yResult {
  documentTitle: string;
  pageUrl: string;
  issues: PallyIssue[];
}

class PallyIssue {
  code: string;
  context: string;
  message: string;
  selector: string;
  type: string;
  typeCode: number;
}

function loginPally(): Pa11yResult {
  const systemOwnerUsername = TestData.SMOKE_TEST_USER_USERNAME;
  const systemOwnerPassword = TestData.SMOKE_TEST_USER_PASSWORD;
  return pa11y(config.TEST_URL + '/login', {
    hideElements: '.govuk-footer__licence-logo, .govuk-header__logotype-crown',
    actions: [
      `set field #username to ${systemOwnerUsername}`,
      `set field #password to ${systemOwnerPassword}`,
      'click element .button',
      'wait for path to be /'
    ]
  });
}

beforeAll((done /* call it or remove it*/) => {
  loginPally();
  done(); // calling it
});

function ensurePageCallWillSucceed(url: string): Promise<void> {
  return axios.get(url);
}

function runPallyWith(url: string, actions: string[]): Pa11yResult {
  return pa11y(config.TEST_URL + url, {
    hideElements: '.govuk-footer__licence-logo, .govuk-header__logotype-crown',
    actions: actions
  });
}

function expectNoErrors(messages: PallyIssue[]): void {
  const errors = messages.filter(m => m.type === 'error');

  if (errors.length > 0) {
    const errorsAsJson = `${JSON.stringify(errors, null, 2)}`;
    fail(`There are accessibility issues: \n${errorsAsJson}\n`);
  }
}

function testAccessibilityWithActions(url: string, actions: string[]): void {
  describe(`Page ${url}`, () => {
    test('should have no accessibility errors', done => {
      ensurePageCallWillSucceed(url)
        .then(() => runPallyWith(url, actions))
        .then((result: Pa11yResult) => {
          expectNoErrors(result.issues);
          done();
        })
        .catch((err: Error) => done(err));
    });
  });

}

function testAccessibility(url: string): void {
  testAccessibilityWithActions(url, []);
}

describe('Accessibility', () => {
  // testing accessibility of the home page
  testAccessibility('/');
  // TODO: include each path of your application in accessibility checks
});
