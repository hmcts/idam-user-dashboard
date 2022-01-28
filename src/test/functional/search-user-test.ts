import {config} from '../config';
import StringOrSecret = CodeceptJS.StringOrSecret;
import * as Assert from 'assert';

Feature('Search User');

const userName = config.SMOKE_TEST_USER_USERNAME as StringOrSecret;
const incorrectEmailAddresses = new DataTable(['incorrectEmailAddress']);
incorrectEmailAddresses.add(['email']); // adding records to a table
incorrectEmailAddresses.add(['email@']);
incorrectEmailAddresses.add(['email@com']);

const SUPER_USER_EMAIL = 'superusersearch@test.com';
const ADMIN_USER_EMAIL = 'adminusersearch@test.com';

BeforeSuite(async ({ I }) => {
  await I.createUserWithRoles(SUPER_USER_EMAIL,config.SUPER_USER_FIRSTNAME,[config.SUPER_USER_ROLE]);
  await I.createUserWithRoles(ADMIN_USER_EMAIL,config.ADMIN_USER_FIRSTNAME,[config.ADMIN_USER_ROLE]);
});

AfterSuite(async ({ I }) => {
  await I.deleteUser(SUPER_USER_EMAIL);
  await I.deleteUser(ADMIN_USER_EMAIL);
});

Data(incorrectEmailAddresses).Scenario('I as an user should be able to see proper error message if search text is not in the right format', ({I,current}) => {
  I.loginAsSystemOwner();
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', current.incorrectEmailAddress);
  I.click('Search');
  I.seeElement('#email-error');
  I.waitForText('The email address is not in the correct format');
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as a SystemOwner should be able to Search for users', async ({I}) => {
  I.loginAsSystemOwner();
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', userName);
  I.click('Search');
  I.waitForText('User Details');
  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(),'Active');
  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), userName);
  const firstName = await I.grabTextFrom('#first-name');
  Assert.equal(firstName.trim(),'System');
  const lastName = await I.grabTextFrom('#last-name');
  Assert.equal(lastName.trim(),'Owner');
  const assignedRoles = await I.grabTextFrom('#assigned-roles');
  Assert.equal(assignedRoles.trim(),'IDAM_SYSTEM_OWNER');
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as a SuperUser should be able to Search for users', async ({I}) => {
  I.loginAsSuperUser();
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', SUPER_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(),'Active');
  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), SUPER_USER_EMAIL);
  const firstName = await I.grabTextFrom('#first-name');
  Assert.equal(firstName.trim(),config.SUPER_USER_FIRSTNAME);
  const lastName = await I.grabTextFrom('#last-name');
  Assert.equal(lastName.trim(),config.SUPER_ADMIN_CITIZEN_USER_LASTNAME);
  const assignedRoles = await I.grabTextFrom('#assigned-roles');
  Assert.equal(assignedRoles.trim(),config.SUPER_USER_ROLE);
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an AdminUser should be able to Search for users', async ({I}) => {
  I.loginAsAdminUser();
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', ADMIN_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(),'Active');
  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), ADMIN_USER_EMAIL);
  const firstName = await I.grabTextFrom('#first-name');
  Assert.equal(firstName.trim(),config.ADMIN_USER_FIRSTNAME);
  const lastName = await I.grabTextFrom('#last-name');
  Assert.equal(lastName.trim(),config.SUPER_ADMIN_CITIZEN_USER_LASTNAME);
  const assignedRoles = await I.grabTextFrom('#assigned-roles');
  Assert.equal(assignedRoles.trim(),config.ADMIN_USER_ROLE);
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an user should be able to see proper error message if search text left blank', ({I}) => {
  I.loginAsSystemOwner();
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.click('Search');
  I.seeElement('#email-error');
  I.waitForText('You must enter an email address');
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an user should be able to see proper error message if user does not exist', ({I}) => {
  I.loginAsSystemOwner();
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', 'meTesting@test.com');
  I.click('Search');
  I.waitForText('No user matches your search for \'meTesting@test.com\'');
}).retry(config.SCENARIO_RETRY_LIMIT);



