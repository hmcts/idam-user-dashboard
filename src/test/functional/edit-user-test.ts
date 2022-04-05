import {
  createUserWithRoles
} from './shared/testingSupportApi';
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import { BETA_EDIT } from '../../main/app/feature-flags/flags';

Feature('Manage Existing User');

const dashboardUserEMAIL = randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('I as a user should be able to edit and update the user-details successfully',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {

    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithSsoId(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], randomData.getRandomSSOId());
    const activeUser = await I.getUserDetails(activeUserEmail);

    I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', activeUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Edit user');
    I.waitForText('Edit User');

    I.dontSee('Suspend user');
    I.dontSee('Delete user');

    //Checks whether correct user-details retrieved
    const forename = await I.grabValueFrom('#forename');
    Assert.equal(forename.trim(), activeUser[0].forename);

    const surname = await I.grabValueFrom('#surname');
    Assert.equal(surname.trim(), activeUser[0].surname);

    const email = await I.grabValueFrom('#email');
    Assert.equal(email.trim(), activeUser[0].email);

    const updatedForename = testConfig.USER_FIRSTNAME + randomData.getRandomString(5);
    const updatedSurname = testConfig.USER_FIRSTNAME + randomData.getRandomString(10);
    const updatedEmail = randomData.getRandomString(3) + activeUserEmail;

    I.fillField('#forename', updatedForename);
    I.fillField('#surname', updatedSurname);
    I.fillField('#email', updatedEmail);

    I.click('Save');
    I.see('Success');
    I.waitForText('User details updated successfully');

    //Checks whether updated user-details retrieved
    const forenameUpdated = await I.grabValueFrom('#forename');
    Assert.equal(forenameUpdated.trim(), updatedForename);

    const surnameUpdated = await I.grabValueFrom('#surname');
    Assert.equal(surnameUpdated.trim(), updatedSurname);

    const emailUpdated = await I.grabValueFrom('#email');
    Assert.equal(emailUpdated.trim(), updatedEmail);
  }
).tag('@CrossBrowser');

const incorrectEmailAddresses = new DataTable(['incorrectEmailAddress']);
incorrectEmailAddresses.add(['email..@test.com']); // adding records to a table
incorrectEmailAddresses.add(['@email@']);
incorrectEmailAddresses.add(['email@com..']);

Data(incorrectEmailAddresses).Scenario('I as a user should see proper error message when email format is not correct',
  {featureFlags: [BETA_EDIT]},
  async ({I, current}) => {

    const activeUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);

    I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', activeUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Edit user');
    I.waitForText('Edit User');

    I.fillField('#email', current.incorrectEmailAddress);
    I.click('Save');
    I.waitForText('The email address is not in the correct format');
  }
);

Scenario('I as a user should see proper error message when mandatory fields left empty',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {

    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);

    I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', activeUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Edit user');
    I.waitForText('Edit User');

    I.clearField('#forename');
    I.clearField('#surname');
    I.clearField('#email');
    I.click('Save');
    I.waitForText('There is a problem');
    I.waitForText('You must enter a forename for the user');
    I.waitForText('You must enter a surname for the user');
    I.waitForText('The email address is not in the correct format');

    I.fillField('#forename', '');
    I.fillField('#surname', ' ');
    I.fillField('#email', ' ');
    I.click('Save');
    I.waitForText('There is a problem');
    I.waitForText('You must enter a forename for the user');
    I.waitForText('You must enter a surname for the user');
    I.waitForText('The email address is not in the correct format');
  }
);

Scenario('I as a user should see proper error message when no changes were made before updating',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {

    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);

    I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', activeUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Edit user');
    I.waitForText('Edit User');
    I.click('Save');
    I.waitForText('There is a problem');
    I.waitForText('No changes to the user were made');
  }
);
