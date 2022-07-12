import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {
  assignRolesToParentRole,
  createAssignableRoles,
  createUserWithRoles,
  createUserWithSsoId
} from './shared/testingSupportApi';

Feature('Remove SSO ID');

const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();
const INDEPENDENT_CHILD_ROLE = randomData.getRandomRole();
const INDEPENDENT_USER_EMAIL = randomData.getRandomEmailAddress();
let independantUser;

BeforeSuite(async () => {
  await createAssignableRoles(INDEPENDENT_CHILD_ROLE);
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
  independantUser = await createUserWithSsoId(INDEPENDENT_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [INDEPENDENT_CHILD_ROLE], randomData.getRandomSSOId());
});

Scenario('I as a user should be able to remove sso from user account', async ({I}) => {
  I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', INDEPENDENT_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  I.see(INDEPENDENT_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.see(independantUser.ssoId);
  I.see(independantUser.ssoProvider);
  I.see('Remove SSO');
  I.click('Remove SSO');
  I.waitForText('Are you sure you want to remove single sign-on for this user? The user will need to reset their password.');
  I.click('#confirmRadio');
  I.click('Continue');
  I.waitForText('Single sign-on removed successfully');
  I.click('Return to user details');
  I.waitForText('User Details');
  I.see(INDEPENDENT_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.dontSee(independantUser.ssoId);
  I.dontSee(independantUser.ssoProvider);
}).tag('@CrossBrowser');

Scenario('I as a user should be able to select no while removing sso', async ({I}) => {
  I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', INDEPENDENT_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  I.see(INDEPENDENT_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.see(independantUser.ssoId);
  I.see(independantUser.ssoProvider);
  I.see('Remove SSO');
  I.click('Remove SSO');
  I.waitForText('Are you sure you want to remove single sign-on for this user? The user will need to reset their password.');
  I.click('#confirmRadio-2');
  I.click('Continue');
  I.waitForText('User Details');
  I.see(INDEPENDENT_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.see(independantUser.ssoId);
  I.see(independantUser.ssoProvider);
}).tag('@CrossBrowser');

