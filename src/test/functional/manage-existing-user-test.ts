import {
  getUserDetails,
  convertISODateTimeToUTCFormat,
  createUserWithSsoId,
  createUserWithRoles,
  deleteUser,
  suspendUser,
  retireStaleUser,
  deleteStaleUser
} from './shared/apiHelpers';

Feature('Manage Existing User');
import {config as testConfig, testAccounts} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';

const TEST_SUITE_PREFIX = 'TEST_EXISTING_USER';
const credentials = new DataTable(['email', 'password']);
credentials.add([testConfig.SMOKE_TEST_USER_USERNAME, testConfig.SMOKE_TEST_USER_PASSWORD]);
credentials.add([testAccounts.superUser.email, testAccounts.superUser.password]);
credentials.add([testAccounts.adminUser.email, testAccounts.adminUser.password]);

Data(credentials).Scenario('I should be able to see the active status of an user', async ({I, current}) => {

  const activeUserEmail = TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  await createUserWithSsoId(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], randomData.getRandomString(5));
  const activeUser = await getUserDetails(activeUserEmail);
  I.loginAs(current.email, current.password);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', activeUserEmail);
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

  await deleteUser(activeUserEmail);
});

Data(credentials).Scenario('I should be able to see the suspended status of an user', async ({I, current}) => {

  const suspendUserEmail = TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  const user = await createUserWithRoles(suspendUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);
  await suspendUser(user.id, suspendUserEmail);

  I.loginAs(current.email, current.password);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', suspendUserEmail);
  I.click('Search');
  I.waitForText('User Details');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), suspendUserEmail);

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(), 'Suspended');

  await deleteUser(suspendUserEmail);
});

Data(credentials).Scenario('I should be able to see the stale status of an user', async ({I, current}) => {

  const staleUserEmail = TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  const user = await createUserWithRoles(staleUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);
  await retireStaleUser(user.id);

  I.loginAs(current.email, current.password);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', staleUserEmail);
  I.click('Search');
  I.waitForText('User Details');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), staleUserEmail);

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(), 'Archived');

  await deleteStaleUser(user.id);
});


