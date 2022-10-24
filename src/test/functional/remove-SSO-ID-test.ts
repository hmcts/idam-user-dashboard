import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {
  assignRolesToParentRole,
  createAssignableRoles,
  createUserWithRoles,
  createUserWithSsoId
} from './shared/testingSupportApi';
import { User } from '../../main/interfaces/User';

Feature('Remove SSO ID');

const PARENT_ROLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE = randomData.getRandomRole();
let dashboardUser: User;
let ssoUserA: User;
let ssoUserB: User;

BeforeSuite(async () => {
  await createAssignableRoles(PARENT_ROLE);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE);
  // Assigning self role with the child role so the this user can also delete same level users
  await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);

  dashboardUser = await createUserWithRoles(
    randomData.getRandomEmailAddress(),
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [testConfig.RBAC.access, PARENT_ROLE]
  );

  ssoUserA = await createUserWithSsoId(
    randomData.getRandomEmailAddress(),
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE],
    randomData.getRandomSSOId()
  );

  ssoUserB = await createUserWithSsoId(
    randomData.getRandomEmailAddress(),
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE],
    randomData.getRandomSSOId()
  );
});


Scenario('I as a user should be able to remove sso from user account', async ({I}) => {
  I.loginAs(dashboardUser.email, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', ssoUserA.email);
  I.click('Search');
  I.waitForText('User Details');
  I.see(ssoUserA.email);
  I.see('IdP User ID');
  I.see('Identity Provider');
  I.see(ssoUserA.ssoId);
  I.see(ssoUserA.ssoProvider);
  I.see('Remove SSO');
  I.click('Remove SSO');
  I.waitForText('Are you sure you want to remove single sign-on for this user? The user will need to reset their password.');
  I.click('#confirmRadio');
  I.click('Continue');
  I.waitForText('Single sign-on removed successfully');
  I.click('Return to user details');
  I.waitForText('User Details');
  I.see(ssoUserA.email);
  I.dontSee('IdP User ID');
  I.dontSee('Identity Provider');
  I.dontSee(ssoUserA.ssoId);
  I.dontSee(ssoUserA.ssoProvider);
}).tag('@CrossBrowser');

Scenario('I as a user should be able to select no while removing sso', async ({I}) => {
  I.loginAs(dashboardUser.email, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', ssoUserB.email);
  I.click('Search');
  I.waitForText('User Details');
  I.see(ssoUserB.email);
  I.see('IdP User ID');
  I.see('Identity Provider');
  I.see(ssoUserB.ssoId);
  I.see(ssoUserB.ssoProvider);
  I.see('Remove SSO');
  I.click('Remove SSO');
  I.waitForText('Are you sure you want to remove single sign-on for this user? The user will need to reset their password.');
  I.click('#confirmRadio-2');
  I.click('Continue');
  I.waitForText('User Details');
  I.see(ssoUserB.email);
  I.see('IdP User ID');
  I.see('Identity Provider');
  I.see(ssoUserB.ssoId);
  I.see(ssoUserB.ssoProvider);
}).tag('@CrossBrowser');

