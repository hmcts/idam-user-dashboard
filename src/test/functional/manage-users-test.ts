import {
  getUserDetails,
  createUserWithSsoId,
  createUserWithRoles,
  suspendUser,
  retireStaleUser,
  deleteStaleUser
} from './shared/testingSupportApi';

import '../../main/utils/utils';

Feature('Manage Existing User');
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {convertISODateTimeToUTCFormat} from '../../main/utils/utils';

const dashboardUserEMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('@CrossBrowser I should be able to see the active status of an user', async ({I}) => {
  const activeUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  await I.createUserWithSsoId(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], randomData.getRandomString(5));
  const activeUser = await I.getUserDetails(activeUserEmail);

  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
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
});

Scenario('I should be able to see the suspended status of an user', async ({I}) => {
  const suspendUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  const user = await I.createUserWithRoles(suspendUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);
  await I.suspendUser(user.id, suspendUserEmail);

  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
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

Scenario('I should be able to see the stale status of an user', async ({I}) => {
  const staleUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  const user = await I.createUserWithRoles(staleUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);
  await I.retireStaleUser(user.id);

  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', staleUserEmail);
  I.click('Search');
  I.waitForText('User Details');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), staleUserEmail);

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(), 'Archived');
  await I.deleteStaleUser(user.id);
});
