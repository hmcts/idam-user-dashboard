import {config} from '../config';
import StringOrSecret = CodeceptJS.StringOrSecret;

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

Data(incorrectEmailAddresses).Scenario('I as an user should be able to see proper error message if search text is not in the right format', ({I, current}) => {
  I.click('#email');
  I.fillField('#email', current.incorrectEmailAddress);
  I.click('Search');
  I.seeElement('#email-error');
  I.waitForText('The email address is not in the correct format');
});

Scenario('I as an user should be able to Search for users', ({I}) => {
  I.click('#email');
  I.fillField('#email', config.SMOKE_TEST_USER_USERNAME as StringOrSecret);
  I.click('Search');
  I.waitForText('User Details');
});

Scenario('I as an user should be able to see proper error message if search text left blank', ({I}) => {
  I.click('#email');
  I.click('Search');
  I.seeElement('#email-error');
  I.waitForText('You must enter an email address');
});

Scenario('I as an user should be able to see proper error message if user does not exist', ({I}) => {
  I.click('#email');
  I.fillField('#email', 'meTesting@test.com');
  I.click('Search');
  I.waitForText('No user matches your search for \'meTesting@test.com\'');
});

