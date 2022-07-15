import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {
  assignRolesToParentRole,
  createAssignableRoles,
  createUserWithRoles,
  createUserWithSsoId
} from './shared/testingSupportApi';

Feature('Remove SSO ID');

const PARENT_ROLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE = randomData.getRandomRole();
const INDEPENDENT_CHILD_ROLE = randomData.getRandomRole();
const PARENT_ROLE_EMAIL = randomData.getRandomEmailAddress();
const REMOVABLE_SSO_USER_EMAIL = randomData.getRandomEmailAddress();
const NON_REMOVABLE_SSO_USER_EMAIL = randomData.getRandomEmailAddress();
let removableSsoUser;
let nonRemovableSsoUser;

BeforeSuite(async () => {
  await createAssignableRoles(PARENT_ROLE);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE);
  await createAssignableRoles(INDEPENDENT_CHILD_ROLE);
  // Assigning self role with the child role so the this user can also delete same level users
  await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);
  await createUserWithRoles(PARENT_ROLE_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
  removableSsoUser = await createUserWithSsoId(REMOVABLE_SSO_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [ASSIGNABLE_CHILD_ROLE], randomData.getRandomSSOId());
  nonRemovableSsoUser = await createUserWithSsoId(NON_REMOVABLE_SSO_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [INDEPENDENT_CHILD_ROLE], randomData.getRandomSSOId());
});

Scenario('I as a user should not see remove sso option if I do not have the right role to remove sso', async ({I}) => {
  I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', NON_REMOVABLE_SSO_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  I.see(NON_REMOVABLE_SSO_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.see(nonRemovableSsoUser.ssoId);
  I.see(nonRemovableSsoUser.ssoProvider);
  I.dontSee('Remove SSO');
}).tag('@CrossBrowser');

Scenario('I as a user should be able to remove sso from user account', async ({I}) => {
  I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', REMOVABLE_SSO_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  I.see(REMOVABLE_SSO_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.see(removableSsoUser.ssoId);
  I.see(removableSsoUser.ssoProvider);
  I.see('Remove SSO');
  I.click('Remove SSO');
  I.waitForText('Are you sure you want to remove single sign-on for this user? The user will need to reset their password.');
  I.click('#confirmRadio');
  I.click('Continue');
  I.waitForText('Single sign-on removed successfully');
  I.click('Return to user details');
  I.waitForText('User Details');
  I.see(REMOVABLE_SSO_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.dontSee(removableSsoUser.ssoId);
  I.dontSee(removableSsoUser.ssoProvider);
}).tag('@CrossBrowser');

Scenario('I as a user should be able to select no while removing sso', async ({I}) => {
  I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', REMOVABLE_SSO_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  I.see(REMOVABLE_SSO_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.see(removableSsoUser.ssoId);
  I.see(removableSsoUser.ssoProvider);
  I.see('Remove SSO');
  I.click('Remove SSO');
  I.waitForText('Are you sure you want to remove single sign-on for this user? The user will need to reset their password.');
  I.click('#confirmRadio-2');
  I.click('Continue');
  I.waitForText('User Details');
  I.see(REMOVABLE_SSO_USER_EMAIL);
  I.see('Single sign-on ID');
  I.see('Single sign-on provider');
  I.see(removableSsoUser.ssoId);
  I.see(removableSsoUser.ssoProvider);
}).tag('@CrossBrowser');

