import { config as testConfig, testAccounts } from '../config';
import * as Assert from 'assert';

Feature('Search User');

const incorrectEmailAddresses = new DataTable(['incorrectEmailAddress']);
incorrectEmailAddresses.add(['email']); // adding records to a table
incorrectEmailAddresses.add(['email@']);
incorrectEmailAddresses.add(['email@com']);

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
});

const credentials = new DataTable(['email', 'password']);
credentials.add([testConfig.SMOKE_TEST_USER_USERNAME, testConfig.SMOKE_TEST_USER_PASSWORD]);
credentials.add([testAccounts.superUser.email, testConfig.PASSWORD]);
credentials.add([testAccounts.adminUser.email, testConfig.PASSWORD]);

Data(credentials).Scenario('I should be able to search for users', async ({I, current}) => {
  I.loginAs(current.email, current.password);
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
  I.click('#email');
  I.fillField('#email', testAccounts.citizenUser.email);
  I.click('Search');
  I.waitForText('User Details');

  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(),'Active');

  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), testAccounts.citizenUser.email);

  const firstName = await I.grabTextFrom('#first-name');
  Assert.equal(firstName.trim(), testConfig.USER_FIRSTNAME);

  const lastName = await I.grabTextFrom('#last-name');
  Assert.equal(lastName.trim(), testConfig.SUPER_ADMIN_CITIZEN_USER_LASTNAME);

  const assignedRoles = await I.grabTextFrom('#assigned-roles');
  Assert.equal(assignedRoles.trim(), testAccounts.citizenUser.role);
});

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
});

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
  I.waitForText('No user matches your search for: meTesting@test.com');
});
