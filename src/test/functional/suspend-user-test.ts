import {
  createUserWithRoles
} from './shared/testingSupportApi';
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {BETA_SUSPEND} from '../../main/app/feature-flags/flags';

Feature('Suspend and Unsuspend User');

const DASHBOARD_USER_EMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('I as a user should be able to suspend and unsuspend user',
  {featureFlags: [BETA_SUSPEND]},
  async ({I}) => {

    const suspendUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await I.createUserWithRoles(suspendUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', suspendUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Suspend user');
    I.waitForText('Are you sure you want to suspend this user?');
    I.click('Yes');
    I.click('Continue');
    I.waitForText('User suspended successfully');
    I.waitForText('The following account has been suspended:');
    I.waitForText(suspendUserEmail);
    I.click('Return to main menu');

    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', suspendUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.see(suspendUserEmail);
    I.see(suspendUserEmail);
    I.see('SUSPENDED');
    I.logout();

    I.loginAs(suspendUserEmail, testConfig.PASSWORD);
    I.waitForText('There is a problem with your account login details');
    I.waitForText('Your account has been blocked. Contact us to get help signing in.');

    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', suspendUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Unsuspend user');
    I.waitForText('Are you sure you want to unsuspend this user?');
    I.click('Yes');
    I.click('Continue');
    I.waitForText('User unsuspended successfully');
    I.waitForText('The following account has been unsuspended:');
    I.waitForText(suspendUserEmail);
    I.click('Return to user details');
    I.see('ACTIVE');

    I.logout();
    I.loginAs(suspendUserEmail, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', suspendUserEmail);
    I.click('Search');
    I.waitForText('User Details');
  }
).tag('@CrossBrowser');

Scenario('I as a user should be redirected to user-details page if I select no when suspending a user',
  {featureFlags: [BETA_SUSPEND]},
  async ({I}) => {

    const suspendUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await I.createUserWithRoles(suspendUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', suspendUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Suspend user');
    I.waitForText('Are you sure you want to suspend this user?');
    I.click('No');
    I.click('Continue');
    I.waitForText('User Details');
    I.see('ACTIVE');

    I.see('Suspend user');
  }
);

Scenario('I as a user should be redirected to user-details page if I select no when unsuspending a user',
  {featureFlags: [BETA_SUSPEND]},
  async ({I}) => {

    const suspendUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    const user = await I.createUserWithRoles(suspendUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);
    await I.suspendUser(user.id, suspendUserEmail);
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', suspendUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Unsuspend user');
    I.waitForText('Are you sure you want to unsuspend this user?');
    I.click('No');
    I.click('Continue');
    I.waitForText('User Details');
    I.see('SUSPENDED');

    I.see('Unsuspend user');
  }
);
