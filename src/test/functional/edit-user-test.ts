import {
  createRoleFromTestingSupport,
  createUserWithRoles
} from './shared/testingSupportApi';
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {BETA_EDIT, GAMMA_MFA} from '../../main/app/feature-flags/flags';

Feature('Edit User');

const PARENT_ROLE = randomData.getRandomRole();
const PARENT_ROLE_WITH_MFA_ASSIGNABLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE1 = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE2 = randomData.getRandomRole();
const INDEPENDANT_CHILD_ROLE = randomData.getRandomRole();
const PARENT_ROLE_EMAIL = randomData.getRandomEmailAddress();

const MFA_ENABLED_FLAG = 'enabled';
const MFA_DISABLED_TEXT = 'DISABLED';
const MFA_SECURITY_WARNING = 'Only disable MFA for a user if they have a \'justice.gov.uk\' or \'hmcts.net\' email address. Contact the information security team if you want to make an exception.';

BeforeSuite(async () => {
  await createRoleFromTestingSupport(ASSIGNABLE_CHILD_ROLE1,[]);
  await createRoleFromTestingSupport(ASSIGNABLE_CHILD_ROLE2,[]);
  await createRoleFromTestingSupport(INDEPENDANT_CHILD_ROLE,[]);
  // Assigning self role with the child role so the this user can also delete same level users
  await createRoleFromTestingSupport(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE1, PARENT_ROLE, ASSIGNABLE_CHILD_ROLE2]);
  await createRoleFromTestingSupport(PARENT_ROLE_WITH_MFA_ASSIGNABLE, [ASSIGNABLE_CHILD_ROLE1, PARENT_ROLE_WITH_MFA_ASSIGNABLE, testConfig.USER_ROLE_IDAM_MFA_DISABLED]);
  await createUserWithRoles(PARENT_ROLE_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
});

Scenario('I as a user should be able to edit and update the user-details successfully',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    const activeUserDetails = await I.createUserWithRoles(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.USER_ROLE_CITIZEN]
    );

    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(activeUserEmail);
    I.click('Edit user');
    I.seeInCurrentUrl('/user/edit');
    I.dontSee('Suspend user');
    I.dontSee('Delete user');

    //Checks whether correct user-details retrieved
    const forename = await I.grabValueFrom('#forename');
    Assert.equal(forename.trim(), activeUserDetails.forename);

    const surname = await I.grabValueFrom('#surname');
    Assert.equal(surname.trim(), activeUserDetails.surname);

    const email = await I.grabValueFrom('#email');
    Assert.equal(email.trim(), activeUserDetails.email);

    const updatedForename = testConfig.USER_FIRSTNAME + randomData.getRandomString(5);
    const updatedSurname = testConfig.USER_FIRSTNAME + randomData.getRandomString(10);
    const updatedEmail = randomData.getRandomString(3) + activeUserEmail;

    I.fillField('#forename', updatedForename);
    I.fillField('#surname', updatedSurname);
    I.fillField('#email', updatedEmail);
    I.click('Save');
    I.see('Success');
    I.see('User details updated successfully');

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

    I.createUserWithRoles(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.USER_ROLE_CITIZEN]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(activeUserEmail);
    I.click('Edit user');
    I.see('Edit User');
    I.fillField('#email', current.incorrectEmailAddress);
    I.click('Save');
    I.see('The email address is not in the correct format');
  });

Scenario('I as a user should see proper error message when mandatory fields left empty',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.USER_ROLE_CITIZEN]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(activeUserEmail);
    I.click('Edit user');
    I.seeInCurrentUrl('/user/edit');
    I.clearField('#forename');
    I.clearField('#surname');
    I.clearField('#email');
    I.click('Save');
    I.see('There is a problem');
    I.see('You must enter a forename for the user');
    I.see('You must enter a surname for the user');
    I.see('The email address is not in the correct format');
    I.fillField('#forename', '');
    I.fillField('#surname', ' ');
    I.fillField('#email', ' ');
    I.click('Save');
    I.see('There is a problem');
    I.see('You must enter a forename for the user');
    I.see('You must enter a surname for the user');
    I.see('The email address is not in the correct format');
  });

Scenario('I as a user should see proper error message when no changes were made before updating',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.USER_ROLE_CITIZEN]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(activeUserEmail);
    I.click('Edit user');
    I.seeInCurrentUrl('/user/edit');
    I.click('Save');
    I.see('There is a problem');
    I.see('No changes to the user were made');
  });

Scenario('I as a user should be able to edit roles only if I have the permission to do so',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [INDEPENDANT_CHILD_ROLE]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(activeUserEmail);
    I.see(INDEPENDANT_CHILD_ROLE);
    I.dontSee(ASSIGNABLE_CHILD_ROLE1);
    I.click('Edit user');
    I.seeInCurrentUrl('/user/edit');
    I.see(ASSIGNABLE_CHILD_ROLE1);
    I.see(INDEPENDANT_CHILD_ROLE);

    //Checking the role which user doesn't have permission to assign is disabled
    const disabledRoles = await I.grabValueFromAll(locate('//input[@name=\'roles\' and @disabled]'));
    Assert.equal(disabledRoles.includes(INDEPENDANT_CHILD_ROLE), true);

    I.click(ASSIGNABLE_CHILD_ROLE1);
    I.click('Save');
    I.see('Success');
    I.see('User details updated successfully');
    I.click('Return to user details');
    I.see('User Details');
    I.see(INDEPENDANT_CHILD_ROLE);
    I.see(ASSIGNABLE_CHILD_ROLE1);
  });

Scenario('I as a user should be able to edit mfa',
  {featureFlags: [BETA_EDIT, GAMMA_MFA]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [testConfig.RBAC.access, testConfig.USER_ROLE_IDAM_MFA_DISABLED, PARENT_ROLE_WITH_MFA_ASSIGNABLE]
    );

    I.loginAs(activeUserEmail);
    I.see('Manage an existing user');
    I.gotoUserDetails(activeUserEmail);
    I.see(MFA_DISABLED_TEXT);
    I.click('Edit user');
    I.seeInCurrentUrl('/user/edit');
    I.dontSee(MFA_SECURITY_WARNING);

    const mfaFlag = await I.grabValueFrom(locate('//input[@name=\'multiFactorAuthentication\']'));
    Assert.equal(mfaFlag, MFA_ENABLED_FLAG);

    I.click('Enabled');
    I.click('Save');
    I.see('Success');
    I.see('User details updated successfully');
    I.click('Return to user details');
    I.see('User Details');
    I.see('ENABLED');
    I.click('Edit user');
    I.seeInCurrentUrl('/user/edit');
    I.see(MFA_SECURITY_WARNING);
  });

Scenario('I as a user should not be able to edit or update the user`s email when user has SSO enabled',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    const activeUserSsoId = randomData.getRandomSSOId();

    I.createUserWithSsoId(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [INDEPENDANT_CHILD_ROLE],
      activeUserSsoId
    );
    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.see('Manage an existing user');
    I.gotoUserDetails(activeUserEmail);
    I.see(activeUserEmail);
    I.see(activeUserSsoId);
    I.click('Edit user');
    I.seeInCurrentUrl('/user/edit');
    I.seeElement('#email:disabled');
    // I.fillField('#email', randomData.getRandomEmailAddress());
    I.click('Save');
    I.see('There is a problem');
    I.see('No changes to the user were made');

    const emailFieldValue = await I.grabValueFrom('#email');
    Assert.equal(emailFieldValue, activeUserEmail);
  });

Scenario('I as a user should be able to filter through roles while updating the user details',
  {featureFlags: [BETA_EDIT]},
  async ({I}) => {
    const activeUserEmail = randomData.getRandomEmailAddress();
    const searchText = ASSIGNABLE_CHILD_ROLE2.substring(0, 10);

    I.createUserWithRoles(
      activeUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [ASSIGNABLE_CHILD_ROLE1]
    );
    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.see('Manage an existing user');
    I.gotoUserDetails(activeUserEmail);
    I.click('Edit user');
    I.seeInCurrentUrl('/user/edit');
    I.dontSee('Suspend user');
    I.dontSee('Delete user');
    I.see(ASSIGNABLE_CHILD_ROLE1);
    I.see(ASSIGNABLE_CHILD_ROLE2);
    I.see(PARENT_ROLE);
    I.click('#roles__search-box');
    I.fillField('#roles__search-box', searchText);

    const checkboxes = await I.grabValueFromAll(locate('//div[@class=\'govuk-checkboxes__item\' and not(@hidden)]/input[@name=\'roles\']'));
    checkboxes.forEach(function (checkbox) {
      if (checkbox.includes(searchText) && !checkbox.includes(testConfig.RBAC.access)) {
        Assert.ok(true);
      } else {
        Assert.ok(false);
      }
    });
  });
