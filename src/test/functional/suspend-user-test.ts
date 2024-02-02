import { createUserWithRoles } from './shared/testingSupportApi';
import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {BETA_SUSPEND} from '../../main/app/feature-flags/flags';

Feature('Suspend and Unsuspend User');

const DASHBOARD_USER_EMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createUserWithRoles(
    DASHBOARD_USER_EMAIL,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [testConfig.RBAC.access]
  );
});

Scenario('I as a user should be able to suspend a user',
  {featureFlags: [BETA_SUSPEND]},
  async ({I}) => {
    const userEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      userEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.USER_ROLE_CITIZEN]
    );
    I.retry(3).loginAs(DASHBOARD_USER_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(userEmail);
    I.see('Active');
    I.click('Suspend user');
    I.see('Are you sure you want to suspend this user?');
    I.click('Yes');
    I.click('Continue');
    I.see('User suspended successfully');
    I.see(userEmail);
    I.click('Return to user details');
    I.see('Suspended');
    I.see(userEmail);
  }
).tag('@CrossBrowser');

Scenario('I as a user should be able to unsuspend a user',
  {featureFlags: [BETA_SUSPEND]},
  async ({I}) => {
    const userEmail = randomData.getRandomEmailAddress();

    const { id } = await I.createUserWithRoles(
      userEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.USER_ROLE_CITIZEN]
    );
    I.suspendUser(id);
    I.retry(3).loginAs(DASHBOARD_USER_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(userEmail);
    I.see('Suspended');
    I.click('Unsuspend user');
    I.see('Are you sure you want to unsuspend this user?');
    I.click('Yes');
    I.click('Continue');
    I.see('User unsuspended successfully');
    I.see(userEmail);
    I.click('Return to user details');
    I.see('Active');
    I.see(userEmail);
  }
);

Scenario('I as a user should be redirected to user-details page if I select no when suspending a user',
  {featureFlags: [BETA_SUSPEND]},
  async ({I}) => {
    const userEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      userEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.USER_ROLE_CITIZEN]
    );
    I.retry(3).loginAs(DASHBOARD_USER_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(userEmail);
    I.see('Active');
    I.click('Suspend user');
    I.see('Are you sure you want to suspend this user?');
    I.click('No');
    I.click('Continue');
    I.see('Active');
    I.see('Suspend user');
    I.see(userEmail);
  }
);

Scenario('I as a user should be redirected to user-details page if I select no when unsuspending a user',
  {featureFlags: [BETA_SUSPEND]},
  async ({I}) => {
    const userEmail = randomData.getRandomEmailAddress();

    const { id } = await I.createUserWithRoles(
      userEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.USER_ROLE_CITIZEN]
    );
    I.suspendUser(id);
    I.retry(3).loginAs(DASHBOARD_USER_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(userEmail);
    I.see('Suspended');
    I.click('Unsuspend user');
    I.see('Are you sure you want to unsuspend this user?');
    I.click('No');
    I.click('Continue');
    I.see('Suspended');
    I.see('Unsuspend user');
    I.see(userEmail);
  }
);
