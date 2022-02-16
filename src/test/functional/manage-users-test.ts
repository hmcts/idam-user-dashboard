import {
  getUserDetails,
  createUserWithSsoId,
  createUserWithRoles,
  suspendUser,
  retireStaleUser,
  deleteStaleUser
} from './shared/apiHelpers';

import '../../main/utils/utils';

Feature('Manage Existing User');
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {convertISODateTimeToUTCFormat} from '../../main/utils/utils';

const dashboardUserEMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, []);
});

Scenario('I should be able to see the active status of an user', async ({I}) => {
  const activeUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  await createUserWithSsoId(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], randomData.getRandomString(5));
  const activeUser = await getUserDetails(activeUserEmail);

  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
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
});

Scenario('I should be able to see the suspended status of an user', async ({I}) => {
  const suspendUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  const user = await createUserWithRoles(suspendUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);
  await suspendUser(user.id, suspendUserEmail);

  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
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
});

Scenario('I should be able to see the stale status of an user', async ({I}) => {
  const staleUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  const user = await createUserWithRoles(staleUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);
  await retireStaleUser(user.id);

  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
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
