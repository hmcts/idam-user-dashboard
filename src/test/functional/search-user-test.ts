import { config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {createUserWithRoles, createUserWithSsoId} from './shared/apiHelpers';

Feature('Search User');

const dashboardUserEMAIL= testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
const citizenUserEmail= testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
let citizenUser;

BeforeSuite(async () => {
  createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, []);
  citizenUser = await createUserWithSsoId(citizenUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], randomData.getRandomString(5));
});

const incorrectEmailAddresses = new DataTable(['incorrectEmailAddress']);
incorrectEmailAddresses.add(['email..@test.com']); // adding records to a table
incorrectEmailAddresses.add(['email@']);
incorrectEmailAddresses.add(['email@com']);

Data(incorrectEmailAddresses).Scenario('I as an user should be able to see proper error message if search text is not in the right format', ({I,current}) => {
  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', current.incorrectEmailAddress);
  I.click('Search');
  I.seeElement('#search-error');
  I.waitForText('The email address is not in the correct format');
});

Scenario('@CrossBrowser I should be able to search with user-email', async ({I}) => {
  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', citizenUserEmail);
  I.click('Search');
  I.waitForText('User Details');

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(),'Active');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), citizenUserEmail);

  const firstName = await I.grabTextFrom('#first-name');
  Assert.equal(firstName.trim(), testConfig.USER_FIRSTNAME);

  const lastName = await I.grabTextFrom('#last-name');
  Assert.equal(lastName.trim(), testConfig.USER_LASTNAME);

  const assignedRoles = await I.grabTextFrom('#assigned-roles');
  Assert.equal(assignedRoles.trim(), testConfig.USER_ROLE_CITIZEN);
});

Scenario('@CrossBrowser I should be able to search with user-id', async ({I}) => {
  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', citizenUser.id);
  I.click('Search');
  I.waitForText('User Details');

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(),'Active');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), citizenUserEmail);

  const firstName = await I.grabTextFrom('#first-name');
  Assert.equal(firstName.trim(), testConfig.USER_FIRSTNAME);

  const lastName = await I.grabTextFrom('#last-name');
  Assert.equal(lastName.trim(), testConfig.USER_LASTNAME);

  const assignedRoles = await I.grabTextFrom('#assigned-roles');
  Assert.equal(assignedRoles.trim(), testConfig.USER_ROLE_CITIZEN);
});

Scenario('@CrossBrowser I should be able to search with sso-id', async ({I}) => {
  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', citizenUser.ssoId);
  I.click('Search');
  I.waitForText('User Details');

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(),'Active');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), citizenUserEmail);

  const firstName = await I.grabTextFrom('#first-name');
  Assert.equal(firstName.trim(), testConfig.USER_FIRSTNAME);

  const lastName = await I.grabTextFrom('#last-name');
  Assert.equal(lastName.trim(), testConfig.USER_LASTNAME);

  const assignedRoles = await I.grabTextFrom('#assigned-roles');
  Assert.equal(assignedRoles.trim(), testConfig.USER_ROLE_CITIZEN);
});

Scenario('I as an user should be able to see proper error message if search text left blank', ({I}) => {
  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.click('Search');
  I.seeElement('#search-error');
  I.waitForText('You must enter an email address');
});

Scenario('I as an user should be able to see proper error message if user does not exist', ({I}) => {
  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', 'meTesting@test.com');
  I.click('Search');
  I.waitForText('No user matches your search for: meTesting@test.com');
});
