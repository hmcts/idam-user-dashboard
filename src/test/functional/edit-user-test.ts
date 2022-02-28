import {
  getUserDetails,
  createUserWithSsoId,
  createUserWithRoles,
} from './shared/apiHelpers';
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import { BETA_FEATURES } from '../../main/app/feature-flags/flags';

Feature('Manage Existing User');

const dashboardUserEMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('@CrossBrowser I as an user should be able to edit and update the user-details successfully',
  { featureFlags: [ BETA_FEATURES ] },
  async ({I}) => {

    const activeUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await createUserWithSsoId(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], randomData.getRandomString(5));
    const activeUser = await getUserDetails(activeUserEmail);

    I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
    I.waitForText('Add new users');
    I.waitForText('Manage existing users');
    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', activeUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Edit user');
    I.waitForText('Edit Users');

    I.dontSee('Edit user');
    I.dontSee('Suspend user');
    I.dontSee('Delete user');

    //Checks whether correct user-details retrieved
    const forename = await I.grabValueFrom('#forename');
    Assert.equal(forename.trim(), activeUser[0].forename);

    const surname = await I.grabValueFrom('#surname');
    Assert.equal(surname.trim(), activeUser[0].surname);

    const email = await I.grabValueFrom('#email');
    Assert.equal(email.trim(), activeUser[0].email);

    const updatedForname = testConfig.USER_FIRSTNAME + randomData.getRandomString(5);
    const updatedSurname = testConfig.USER_FIRSTNAME + randomData.getRandomString(10);
    const updatedEmail = randomData.getRandomString(3) + activeUserEmail;

    I.fillField('#forename', updatedForname);
    I.fillField('#surname', updatedSurname);
    I.fillField('#email', updatedEmail);

    I.click('Save');
    I.see('Success');
    I.waitForText('User details updated successfully');

    //Checks whether updated user-details retrieved
    const forenameUpdated = await I.grabValueFrom('#forename');
    Assert.equal(forenameUpdated.trim(), updatedForname);

    const surnameUpdated = await I.grabValueFrom('#surname');
    Assert.equal(surnameUpdated.trim(), updatedSurname);

    const emailUpdated = await I.grabValueFrom('#email');
    Assert.equal(emailUpdated.trim(), updatedEmail);
  }
);
