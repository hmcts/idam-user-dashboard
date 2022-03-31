import {
  assignRolesToParentRole,
  createAssignableRoles,
  createUserWithRoles
} from './shared/testingSupportApi';
import '../../main/utils/utils';
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {convertISODateTimeToUTCFormat} from '../../main/utils/utils';

Feature('Manage Existing User');

const PARENT_ROLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE = randomData.getRandomRole();
const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createAssignableRoles(PARENT_ROLE);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE);
  // Assigning self role with the child role so the this user can also delete same level users
  await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
});

Scenario('I as a user should be able to see the active status of a user', async ({I}) => {
  const activeUserEmail = randomData.getRandomEmailAddress();
  await I.createUserWithSsoId(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [ASSIGNABLE_CHILD_ROLE], randomData.getRandomSSOId());
  const activeUser = await I.getUserDetails(activeUserEmail);

  I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', activeUserEmail);
  I.click('Search');
  I.waitForText('User Details');

  const createDate = convertISODateTimeToUTCFormat(activeUser[0].createDate);
  const lastModified = convertISODateTimeToUTCFormat(activeUser[0].lastModified);

  const userId = await I.grabTextFrom('#user-id');
  Assert.equal(userId.trim(), activeUser[0].id);

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(), 'Active');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), activeUser[0].email);

  const ssoId = await I.grabTextFrom('#sso-id');
  Assert.equal(ssoId.trim(), activeUser[0].ssoId);

  const ssoProvider = await I.grabTextFrom('#sso-provider');
  Assert.equal(ssoProvider.trim(), activeUser[0].ssoProvider);

  const accountCreationDate = await I.grabTextFrom('#account-creation-date');
  Assert.equal(accountCreationDate.trim(), createDate);

  const lastModifiedDate = await I.grabTextFrom('#last-modified');
  Assert.equal(lastModifiedDate.trim(), lastModified);
}).tag('@CrossBrowser');

Scenario('I as a user should be able to see the suspended status of a user', async ({I}) => {
  const suspendUserEmail = randomData.getRandomEmailAddress();
  const user = await I.createUserWithRoles(suspendUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [ASSIGNABLE_CHILD_ROLE]);
  await I.suspendUser(user.id, suspendUserEmail);

  I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', suspendUserEmail);
  I.click('Search');
  I.waitForText('User Details');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), suspendUserEmail);

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(), 'Suspended');
});

Scenario('I as a user should be able to see the stale status of a user', async ({I}) => {
  const staleUserEmail = randomData.getRandomEmailAddress();
  const user = await I.createUserWithRoles(staleUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [ASSIGNABLE_CHILD_ROLE]);
  await I.retireStaleUser(user.id);

  await I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', staleUserEmail);
  I.click('Search');
  I.waitForText('User Details');
  I.dontSee('Edit user');
  I.dontSee('Delete user');
  I.dontSee('Suspend user');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), staleUserEmail);

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(), 'Archived');
  await I.deleteStaleUser(user.id);
});
