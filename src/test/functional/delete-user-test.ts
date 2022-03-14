import {
  createUserWithRoles, createAssignableRoles, assignRolesToParentRole,
} from './shared/testingSupportApi';
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {BETA_FEATURES} from '../../main/app/feature-flags/flags';

Feature('Manage Existing User');

const PARENT_ROLE = testConfig.TEST_SUITE_PREFIX + randomData.getRandomString(10);
const ASSIGNABLE_CHILD_ROLE = testConfig.TEST_SUITE_PREFIX + randomData.getRandomString(10);
const INDEPENDANT_CHILD_ROLE = testConfig.TEST_SUITE_PREFIX + randomData.getRandomString(10);
const PARENT_ROLE_EMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createAssignableRoles(PARENT_ROLE);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE);
  await createAssignableRoles(INDEPENDANT_CHILD_ROLE);
  // Assigning self role with the child role so the this user can also delete same level users
  await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);
  await createUserWithRoles(PARENT_ROLE_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
});

Scenario('I as a user should not be able delete user if I do not have the role with right to delete',
  {featureFlags: [BETA_FEATURES]},
  async ({I}) => {

    const nonDeletableUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await createUserWithRoles(nonDeletableUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [INDEPENDANT_CHILD_ROLE]);
    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', nonDeletableUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.dontSee('Delete user');
  }
);

Scenario('I as a user should not be able delete user with both deletable and other non-deletable roles',
  {featureFlags: [BETA_FEATURES]},
  async ({I}) => {

    const nonDeletableUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await createUserWithRoles(nonDeletableUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [INDEPENDANT_CHILD_ROLE, ASSIGNABLE_CHILD_ROLE]);
    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', nonDeletableUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.dontSee('Delete user');
  }
);

Scenario('@CrossBrowser I as a user if I have the right role, should be able delete user successfully',
  {featureFlags: [BETA_FEATURES]},
  async ({I}) => {
    const deletableUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    const userDataBeforeDeleting = await createUserWithRoles(deletableUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [ASSIGNABLE_CHILD_ROLE]);
    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', deletableUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Delete user');
    I.waitForText('Are you sure you want to delete this user? This action is not reversible.');
    I.click('Yes');
    I.click('Continue');
    I.waitForText('User deleted successfully');
    I.click('Return to main menu');

    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', deletableUserEmail);
    I.click('Search');
    I.waitForText('No user matches your search for: ' + deletableUserEmail);

    I.click('Sign out');
    I.see('Sign in');
    I.fillField('#username', deletableUserEmail);
    I.fillField('#password', testConfig.PASSWORD);
    I.click('Sign in');
    I.waitForText('Incorrect email or password');

    const userDataAfterDeleting = await I.createUserWithRoles(deletableUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [ASSIGNABLE_CHILD_ROLE]);
    Assert.notEqual(userDataBeforeDeleting.id, userDataAfterDeleting.id);
  }
);

Scenario('I as a user should be able delete users with same role successfully',
  {featureFlags: [BETA_FEATURES]},
  async ({I}) => {
    const deletableUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await createUserWithRoles(deletableUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [PARENT_ROLE]);
    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', deletableUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Delete user');
    I.waitForText('Are you sure you want to delete this user? This action is not reversible.');
    I.click('Yes');
    I.click('Continue');
    I.waitForText('User deleted successfully');
    I.click('Return to main menu');
    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', deletableUserEmail);
    I.click('Search');
    I.waitForText('No user matches your search for: ' + deletableUserEmail);
  }
);

Scenario('I as a user should not delete user if I select No',
  {featureFlags: [BETA_FEATURES]},
  async ({I}) => {
    const deletableUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
    await createUserWithRoles(deletableUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [ASSIGNABLE_CHILD_ROLE]);
    I.loginAs(PARENT_ROLE_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', deletableUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    I.click('Delete user');
    I.waitForText('Are you sure you want to delete this user? This action is not reversible.');
    I.click('No');
    I.click('Continue');
    I.waitForText('User Details');
  }
);
