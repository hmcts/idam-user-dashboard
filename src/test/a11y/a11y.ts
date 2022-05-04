import fs from 'fs';
import Axios from 'axios';
import puppeteer from 'puppeteer';
import {randomData} from '../functional/shared/random-data';
import * as urls from '../../main/utils/urls';
import {config as testConfig} from '../config';
import {
  assignRolesToParentRole,
  createAssignableRoles,
  createUserWithRoles, deleteAllTestData
} from '../functional/shared/testingSupportApi';
import {
  ADD_USER_DETAILS_URL,
  ADD_USER_ROLES_URL,
  EDIT_USER_URL,
  USER_DELETE_URL,
  USER_DETAILS_URL,
  USER_SUSPEND_URL
} from '../../main/utils/urls';

const IGNORED_URLS = [urls.LOGIN_URL, urls.LOGOUT_URL, urls.OAUTH2_CALLBACK_URL, urls.ADD_USER_COMPLETION_URL, urls.USER_ACTIONS_URL,
  urls.USER_DETAILS_URL];


const pa11y = require('pa11y');
const axios = Axios.create({baseURL: testConfig.TEST_URL});

const ACCESSIBILITY_TEST_SUITE_PREFIX = 'TEST_IDAM_ACCESSIBILTY_';
const USER_FIRSTNAME = 'TEST_IDAM_ACCESSIBILTY_FIRSTNAME';
const PARENT_ROLE = ACCESSIBILITY_TEST_SUITE_PREFIX + randomData.getRandomString();
const ASSIGNABLE_CHILD_ROLE = ACCESSIBILITY_TEST_SUITE_PREFIX + randomData.getRandomString();
const INDEPENDENT_CHILD_ROLE = ACCESSIBILITY_TEST_SUITE_PREFIX + randomData.getRandomString();
const PARENT_ROLE_EMAIL = ACCESSIBILITY_TEST_SUITE_PREFIX + randomData.getRandomString() + '@idam.test';
const CHILD_ROLE_EMAIL = ACCESSIBILITY_TEST_SUITE_PREFIX + randomData.getRandomString() + '@idam.test';
const NON_EXISTING_USER_EMAIL = 'nonExistingUSer@idam.test';
let CHILD_USER_ID = '';

const postData = new Map<string, string>([
  [USER_DETAILS_URL, `{"search": "${CHILD_ROLE_EMAIL}"}`],
  [EDIT_USER_URL, '{"_action": "edit", "_userId": "CHILD_USER_ID"}'],
  [USER_SUSPEND_URL, '{"_action": "suspend", "_userId": "CHILD_USER_ID"}'],
  [USER_DELETE_URL, '{"_action": "delete", "_userId": "CHILD_USER_ID"}'],
  [ADD_USER_DETAILS_URL, `{"email": "${NON_EXISTING_USER_EMAIL}"}`],
  [ADD_USER_ROLES_URL, '']
]);

interface Pa11yResult {
  documentTitle: string;
  pageUrl: string;
  issues: PallyIssue[];
}

interface PallyIssue {
  code: string;
  context: string;
  message: string;
  selector: string;
  type: string;
  typeCode: number;
}

function ensurePageCallWillSucceed(url: string): Promise<void> {
  return axios.get(url);
}

function runPally(url: string, browser: any): Promise<Pa11yResult> {
  let screenCapture: string | boolean = false;
  if (!testConfig.TestHeadlessBrowser) {
    const screenshotDir = `${__dirname}/../../../functional-output/pa11y`;

    fs.mkdirSync(screenshotDir, {recursive: true});
    screenCapture = `${screenshotDir}/${url.replace(/^\/$/, 'home').replace('/', '')}.png`;
  }

  const options = postData.has(url) ? {
    headers: {'Content-Type': 'application/json'},
    browser,
    screenCapture,
    hideElements: '.govuk-footer__licence-logo, .govuk-header__logotype-crown',
    method: 'POST',
    postData: (postData.get(url) || '').replace('CHILD_USER_ID', CHILD_USER_ID)
  } : {
    browser,
    screenCapture,
    hideElements: '.govuk-footer__licence-logo, .govuk-header__logotype-crown',
  };
  return pa11y(`${testConfig.TEST_URL}${url}`, options);
}

function expectNoErrors(messages: PallyIssue[]): void {
  const errors = messages.filter(m => m.type === 'error');

  if (errors.length > 0) {
    const errorsAsJson = `${JSON.stringify(errors, null, 2)}`;
    throw new Error(`There are accessibility issues: \n${errorsAsJson}\n`);
  }
}

jest.retryTimes(3);
jest.setTimeout(60000);

describe('Accessibility', () => {
  let browser: any;
  let cookies: any;
  let hasAfterAllRun = false;

  const setup = async () => {
    if (hasAfterAllRun) {
      return;
    }
    if (browser) {
      await browser.close();
    }
    await createAssignableRoles(PARENT_ROLE);
    await createAssignableRoles(ASSIGNABLE_CHILD_ROLE);
    await createAssignableRoles(INDEPENDENT_CHILD_ROLE);
    await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);
    await createUserWithRoles(PARENT_ROLE_EMAIL, testConfig.PASSWORD, USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
    const childUser = await createUserWithRoles(CHILD_ROLE_EMAIL, testConfig.PASSWORD, USER_FIRSTNAME, [ASSIGNABLE_CHILD_ROLE, INDEPENDENT_CHILD_ROLE]);
    CHILD_USER_ID = childUser.id;

    browser = await puppeteer.launch({ignoreHTTPSErrors: true});
    browser.on('disconnected', setup);
    // Login once only for other pages to reuse session
    const page = await browser.newPage();
    await page.goto(testConfig.TEST_URL);
    await page.type('#username', PARENT_ROLE_EMAIL);
    await page.type('#password', testConfig.PASSWORD);
    await page.click('input[type="submit"]');
    await page.waitForNavigation();
    cookies = await page.cookies(testConfig.TEST_URL + urls.HOME_URL);
    await page.close();
  };

  beforeAll(setup);

  beforeEach(async () => {
    const page = await browser.newPage();
    await page.goto(testConfig.TEST_URL + urls.HOME_URL);
    await page.setCookie(...cookies);
    await page.close();
  });

  afterAll(async () => {
    hasAfterAllRun = true;
    if (browser) {
      await browser.close();
    }
    await deleteAllTestData(ACCESSIBILITY_TEST_SUITE_PREFIX);
  });

  const urlsNoSignOut = Object.values(urls).filter(url => !IGNORED_URLS.includes(url));
  describe.each(urlsNoSignOut)('Page %s', url => {
    test('should have no accessibility errors', async () => {
      await ensurePageCallWillSucceed(url);
      const result = await runPally(url, browser);
      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
    });
  });
});
