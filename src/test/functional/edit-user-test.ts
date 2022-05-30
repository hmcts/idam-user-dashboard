import {
  assignRolesToParentRole,
  createAssignableRoles,
  createUserWithRoles
} from './shared/testingSupportApi';
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import { BETA_EDIT, GAMMA_MFA } from '../../main/app/feature-flags/flags';

Feature('Edit User');

const PARENT_ROLE = randomData.getRandomRole();
const PARENT_ROLE_WITH_MFA_ASSIGNABLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE = randomData.getRandomRole();
const INDEPENDANT_CHILD_ROLE = randomData.getRandomRole();
const PARENT_ROLE_EMAIL = randomData.getRandomEmailAddress();

const MFA_ENABLED_FLAG = 'enabled';
const MFA_ENABLED_TEXT = 'Enabled';
const MFA_DISABLED_TEXT = 'Disabled';
const MFA_SECURITY_WARNING = 'Only disable MFA for a user if they have a \'justice.gov.uk\' or \'hmcts.net\' email address. Contact the information security team if you want to make an exception.';

BeforeSuite(async () => {
  await createAssignableRoles(PARENT_ROLE);
  await createAssignableRoles(PARENT_ROLE_WITH_MFA_ASSIGNABLE);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE);
  await createAssignableRoles(INDEPENDANT_CHILD_ROLE);
  // Assigning self role with the child role so the this user can also delete same level users
  await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);
  await assignRolesToParentRole(PARENT_ROLE_WITH_MFA_ASSIGNABLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE_WITH_MFA_ASSIGNABLE, testConfig.USER_ROLE_IDAM_MFA_DISABLED]);
  await createUserWithRoles(PARENT_ROLE_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
});

Scenario('I as a user should be able to edit and update the user-details successfully',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithSsoId(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], randomData.getRandomSSOId());
    const activeUser = await I.getUserDetails(activeUserEmail);

    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
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

  }).tag('@CrossBrowser');

const incorrectEmailAddresses = new DataTable(['incorrectEmailAddress']);
incorrectEmailAddresses.add(['email..@test.com']); // adding records to a table
incorrectEmailAddresses.add(['@email@']);
incorrectEmailAddresses.add(['email@com..']);

Data(incorrectEmailAddresses).Scenario('I as a user should see proper error message when email format is not correct',
  {featureFlags: [BETA_EDIT]},
  async ({I, current}) => {
    const activeUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);

    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
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
  });

Scenario('I as a user should see proper error message when mandatory fields left empty',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);

    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
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
  });

Scenario('I as a user should see proper error message when no changes were made before updating',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);

    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
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
  });

Scenario('I as a user should be able to edit roles only if I have the permission to do so',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [INDEPENDANT_CHILD_ROLE]);

    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', activeUserEmail);
    I.click('Search');
    I.waitForText('User Details');

    const assignedRoles = await I.grabTextFromAll('[id^=\'assigned-role\']');
    Assert.equal(assignedRoles.includes(INDEPENDANT_CHILD_ROLE), true);
    Assert.equal(assignedRoles.includes(ASSIGNABLE_CHILD_ROLE), false);

    I.click('Edit user');
    I.waitForText('Edit User');
    I.see(ASSIGNABLE_CHILD_ROLE);
    I.see(INDEPENDANT_CHILD_ROLE);

    //Checking the role which user doesn't have permission to assign is disabled
    const disabledRoles = await I.grabValueFromAll(locate('//input[@name=\'roles\' and @disabled]'));
    Assert.equal(disabledRoles.includes(INDEPENDANT_CHILD_ROLE), true);

    I.click(ASSIGNABLE_CHILD_ROLE);
    I.click('Save');
    I.see('Success');
    I.waitForText('User details updated successfully');
    I.click('Return to user details');
    I.see('User Details');

    const updatedRoles = await I.grabTextFromAll('[id^=\'assigned-role\']');
    Assert.equal(updatedRoles.includes(INDEPENDANT_CHILD_ROLE), true);
    Assert.equal(updatedRoles.includes(ASSIGNABLE_CHILD_ROLE), true);
  });

Scenario('I as a user should be able to edit mfa if I have the assignable role of idam-mfa-disabled',
  {featureFlags: [BETA_EDIT, GAMMA_MFA]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, testConfig.USER_ROLE_IDAM_MFA_DISABLED, PARENT_ROLE_WITH_MFA_ASSIGNABLE]);

    I.loginAs(activeUserEmail, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', activeUserEmail);
    I.click('Search');
    I.waitForText('User Details');

    let mfa = await I.grabTextFrom('#mfa');
    Assert.equal(mfa.includes(MFA_DISABLED_TEXT), true);

    I.click('Edit user');
    I.waitForText('Edit User');
    I.dontSee(MFA_SECURITY_WARNING);

    const mfaFlag = await I.grabValueFrom(locate('//input[@name=\'multiFactorAuthentication\']'));
    Assert.equal(mfaFlag, MFA_ENABLED_FLAG);

    I.click(MFA_ENABLED_TEXT);
    I.click('Save');
    I.see('Success');
    I.waitForText('User details updated successfully');

    I.click('Return to user details');
    I.see('User Details');

    mfa = await I.grabTextFrom('#mfa');
    Assert.equal(mfa.includes(MFA_ENABLED_TEXT), true);

    I.click('Edit user');
    I.waitForText('Edit User');
    I.see(MFA_SECURITY_WARNING);
  });

Scenario('I as a user should not be able to edit mfa if I don\'t have the assignable role of idam-mfa-disabled',
  {featureFlags: [BETA_EDIT, GAMMA_MFA]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [PARENT_ROLE]);

    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', PARENT_ROLE_EMAIL);
    I.click('Search');
    I.waitForText('User Details');

    const mfa = await I.grabTextFrom('#mfa');
    Assert.equal(mfa.includes(MFA_ENABLED_TEXT), true);

    I.click('Edit user');
    I.waitForText('Edit User');
    I.dontSee(MFA_SECURITY_WARNING);

    // Check the mfa enabled checkbox is selected but disabled
    const mfaFlag = await I.grabValueFrom(locate('//input[@name=\'multiFactorAuthentication\' and @checked and @disabled]'));
    Assert.equal(mfaFlag, MFA_ENABLED_FLAG);
  });
