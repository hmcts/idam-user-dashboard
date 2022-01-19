import {config} from '../config';
import StringOrSecret = CodeceptJS.StringOrSecret;
import * as Assert from 'assert';

Feature('Search User');
const incorrectEmailAddresses = new DataTable(['incorrectEmailAddress']);
incorrectEmailAddresses.add(['email']); // adding records to a table
incorrectEmailAddresses.add(['email@']);
incorrectEmailAddresses.add(['email@com']);

Before(({I}) => {
  I.loginAsSystemOwner();
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
});

Data(incorrectEmailAddresses).Scenario('I as an user should be able to see proper error message if search text is not in the right format', ({I,current}) => {
  I.click('#email');
  I.fillField('#email', current.incorrectEmailAddress);
  I.click('Search');
  I.seeElement('#email-error');
  I.waitForText('The email address is not in the correct format');
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an user should be able to Search for users', async ({I}) => {
  I.click('#email');
  I.fillField('#email', config.SMOKE_TEST_USER_USERNAME as StringOrSecret);
  I.click('Search');
  I.waitForText('User Details');
  console.log('ashwini');
  const status = await I.grabTextFrom('#status');
  Assert.equal(status.trim(),'Active');
  const email = await I.grabTextFrom('#email');
  Assert.equal(email.trim(), config.SMOKE_TEST_USER_USERNAME as StringOrSecret);
  const firstName = await I.grabTextFrom('#first-name');
  Assert.equal(firstName.trim(),'System');
  const lastName = await I.grabTextFrom('#last-name');
  Assert.equal(lastName.trim(),'Owner');
  const assignedRoles = await I.grabTextFrom('#assigned-roles');
  Assert.equal(assignedRoles.trim(),'IDAM_SYSTEM_OWNER');
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an user should be able to see proper error message if search text left blank', ({I}) => {
  I.click('#email');
  I.click('Search');
  I.seeElement('#email-error');
  I.waitForText('You must enter an email address');
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an user should be able to see proper error message if user does not exist', ({I}) => {
  I.click('#email');
  I.fillField('#email', 'meTesting@test.com');
  I.click('Search');
  I.waitForText('No user matches your search for \'meTesting@test.com\'');
}).retry(config.SCENARIO_RETRY_LIMIT);

