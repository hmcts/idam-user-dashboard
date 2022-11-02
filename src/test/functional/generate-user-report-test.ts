import {
  createAssignableRoles,
  createUserWithRoles
} from './shared/testingSupportApi';
import '../../main/utils/utils';
import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {GAMMA_GENERATE_REPORT} from '../../main/app/feature-flags/flags';
import * as Assert from 'assert';

Feature('Generate User Report');

const DASHBOARD_USER_ROLE = randomData.getRandomRole();
const SEARCHABLE_ROLE = randomData.getRandomRole();
const SEARCHABLE_ROLE_WITHOUT_USER = randomData.getRandomRole();
const ROLE_NOT_EXIST = randomData.getRandomRole();
const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createAssignableRoles(DASHBOARD_USER_ROLE);
  await createAssignableRoles(SEARCHABLE_ROLE);
  await createAssignableRoles(SEARCHABLE_ROLE_WITHOUT_USER);
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, DASHBOARD_USER_ROLE, SEARCHABLE_ROLE]);
});

Scenario('I as a user should be able to generate user report @special',
  {featureFlags: [GAMMA_GENERATE_REPORT]},
  async ({I}) => {
    const archivedUserEmail = randomData.getRandomEmailAddress();
    const activeUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [SEARCHABLE_ROLE]
    );

    const archivedUser = await I.createUserWithRoles(
      archivedUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [SEARCHABLE_ROLE]
    );
    I.retireStaleUser(archivedUser.id);

    I.loginAs(DASHBOARD_USER_EMAIL);
    I.click('Generate a user report');
    I.click('Continue');
    I.see('Generate report');
    I.fillField('#search', SEARCHABLE_ROLE);
    I.saveScreenshot('filledField.png');
    I.click('Generate report');
    try {
      I.waitForText('Generated Report');
    } catch {
      I.click('Generate report');
      I.waitForText('Generated Report');
    } finally {
      I.see('Download report (CSV)');
      I.see('Account state');
      I.see('Name');
      I.see('Email');
      I.see('Back');

      const firstNames: string[] = await I.grabTextFromAll('table > tbody > tr > *:nth-child(2)');
      const firstNamesBeforeSorting: string[] = firstNames.map(n => n.toLowerCase());
      const firstNamesAfterSorting: string[] = firstNames.map(n => n.toLowerCase()).sort();
      Assert.deepEqual(firstNamesBeforeSorting, firstNamesAfterSorting);

      const emails: string[] = await I.grabTextFromAll('table > tbody > tr > *:nth-child(3)');
      Assert.equal(emails.includes(DASHBOARD_USER_EMAIL), true);
      Assert.equal(emails.includes(activeUserEmail), true);
      Assert.equal(emails.includes(archivedUserEmail), false);

      I.deleteStaleUser(archivedUser.id);
    }
  }).tag('@CrossBrowser');

Scenario('I as a user should not be able to see the users with citizen role and I should see proper error message',
  {featureFlags: [GAMMA_GENERATE_REPORT]},
  async ({I}) => {
    I.loginAs(DASHBOARD_USER_EMAIL);
    I.click('Generate a user report');
    I.click('Continue');
    I.see('Generate report');
    I.click('#search');
    I.fillField('#search', testConfig.USER_ROLE_CITIZEN);
    I.click('Generate report');
    I.see('There is a problem');
    I.see('For security reasons, it is not possible to get a report on all citizen users', '#search-error');
  });

Scenario('I as a user should see proper error message when role name not entered',
  {featureFlags: [GAMMA_GENERATE_REPORT]},
  async ({I}) => {
    I.loginAs(DASHBOARD_USER_EMAIL);
    I.click('Generate a user report');
    I.click('Continue');
    I.see('Generate report');
    I.click('#search');
    I.fillField('#search', ' ');
    I.click('Generate report');
    I.see('There is a problem');
    I.see('You must enter a role or a list of roles (comma seperated)', '#search-error');
  });

Scenario('I as a user should see proper error message when role entered does not exist',
  {featureFlags: [GAMMA_GENERATE_REPORT]},
  async ({I}) => {
    I.loginAs(DASHBOARD_USER_EMAIL);
    I.click('Generate a user report');
    I.click('Continue');
    I.see('Generate report');
    I.click('#search');
    I.fillField('#search', ROLE_NOT_EXIST);
    I.click('Generate report');
    I.see('There is a problem');
    I.see('There are no users with the entered role(s).');
  });

Scenario('I as a user should see proper error message when role entered does not have any user',
  {featureFlags: [GAMMA_GENERATE_REPORT]},
  async ({I}) => {
    I.loginAs(DASHBOARD_USER_EMAIL);
    I.click('Generate a user report');
    I.click('Continue');
    I.see('Generate report');
    I.click('#search');
    I.fillField('#search', SEARCHABLE_ROLE_WITHOUT_USER);
    I.click('Generate report');
    I.see('There is a problem');
    I.see('There are no users with the entered role(s).');
  });
