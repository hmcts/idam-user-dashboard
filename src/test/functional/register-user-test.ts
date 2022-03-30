import {
  assignRolesToParentRole,
  createAssignableRoles,
  createUserWithRoles
} from './shared/testingSupportApi';

import '../../main/utils/utils';

Feature('Manage Existing User');
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {BETA_ADD, BETA_EDIT} from '../../main/app/feature-flags/flags';


const PARENT_ROLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE1 = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE2 = randomData.getRandomRole();
const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createAssignableRoles(PARENT_ROLE);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE1);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE2);
  // Assigning self role with the child role so the this user can also delete same level users
  await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE1, ASSIGNABLE_CHILD_ROLE2, PARENT_ROLE]);
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
});

Scenario('I as a user should be able to register new user',
  {featureFlags: [BETA_ADD]},
  async ({I}) => {
    const registerUserEmail = randomData.getRandomEmailAddress();
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.waitForText('Add new users');
    I.click('Add new users');
    I.click('Continue');
    I.waitForText('Please enter an email address');
    I.click('#email');
    I.fillField('#email', registerUserEmail);
    I.click('Continue');
    I.see('First name');
    I.see('Last name');
    I.see('Select user type');
    I.fillField('#forename', testConfig.USER_FIRSTNAME);
    I.fillField('#surname', testConfig.USER_LASTNAME);
    I.click('Support');
    I.click('Continue');
    I.see(ASSIGNABLE_CHILD_ROLE1);
    I.see(ASSIGNABLE_CHILD_ROLE2);
    I.see(PARENT_ROLE);
    I.checkOption(ASSIGNABLE_CHILD_ROLE2);
    I.click('Save');
    I.waitForText('User registered');

    const response = await I.extractUrlFromNotifyEmail(registerUserEmail);
    const activationParams = response.match(/token=(.*?)&code=([a-zA-Z0-9\\-]+)/);
    const token = activationParams[1];
    const code = activationParams[2];
    await I.activateUserAccount(code, token);

    I.click('Return to main menu');
    I.click('Manage existing users');
    I.click('Continue');
    I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', registerUserEmail);
    I.click('Search');
    I.waitForText('User Details');
    const email = await I.grabTextFrom('#email');
    Assert.equal(email.trim(), registerUserEmail);
  }).tag('@CrossBrowser');


Scenario('I as a user should be able to search for roles',
  {featureFlags: [BETA_ADD]},
  async ({I}) => {
    const registerUserEmail = randomData.getRandomEmailAddress();
    const searchText = ASSIGNABLE_CHILD_ROLE2.substring(0, 10);
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.waitForText('Add new users');
    I.click('Add new users');
    I.click('Continue');
    I.waitForText('Please enter an email address');
    I.click('#email');
    I.fillField('#email', registerUserEmail);
    I.click('Continue');
    I.see('First name');
    I.see('Last name');
    I.see('Select user type');
    I.fillField('#forename', testConfig.USER_FIRSTNAME);
    I.fillField('#surname', testConfig.USER_LASTNAME);
    I.click('Support');
    I.click('Continue');
    I.see(ASSIGNABLE_CHILD_ROLE1);
    I.see(ASSIGNABLE_CHILD_ROLE2);
    I.see(PARENT_ROLE);
    I.click('#roles__search-box');
    I.fillField('#roles__search-box', searchText);
    const checkboxes = await I.grabValueFromAll(locate('//div[@class=\'govuk-checkboxes__item\' and not(@hidden)]/input[@name=\'roles\']'));
    checkboxes.forEach(function (checkbox) {
      if (checkbox.includes(searchText)) {
        Assert.ok(true);
      } else {
        Assert.ok(false);
      }
    });
  });

const incorrectEmailAddresses = new DataTable(['incorrectEmailAddress']);
incorrectEmailAddresses.add(['email..@test.com']); // adding records to a table
incorrectEmailAddresses.add(['@email@']);
incorrectEmailAddresses.add(['email@com..']);

Data(incorrectEmailAddresses).Scenario('I as a user should see proper error message when email format is not correct',
  {featureFlags: [BETA_ADD]},
  async ({I, current}) => {
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.waitForText('Add new users');
    I.click('Add new users');
    I.click('Continue');
    I.waitForText('Please enter an email address');
    I.click('#email');
    I.fillField('#email', current.incorrectEmailAddress);
    I.click('Continue');
    I.waitForText('The email address is not in the correct format');
  }
);

Scenario('I as a user should be able to see proper error messages when add-user validations are not met',
  {featureFlags: [BETA_ADD]},
  async ({I}) => {
    const registerUserEmail = randomData.getRandomEmailAddress();
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.waitForText('Manage existing users');
    I.waitForText('Add new users');
    I.click('Add new users');
    I.click('Continue');
    I.waitForText('Please enter an email address');
    I.click('Continue');
    I.waitForText('There is a problem');
    I.waitForText('You must enter an email address');
    I.click('#email');
    I.fillField('#email', DASHBOARD_USER_EMAIL);
    I.click('Continue');
    I.waitForText(`The email '${DASHBOARD_USER_EMAIL}' already exists`);
    I.clearField('#email');
    I.fillField('#email', registerUserEmail);
    I.click('Continue');
    I.see('First name');
    I.see('Last name');
    I.see('Select user type');
    I.click('Continue');
    I.waitForText('You must enter a forename for the user');
    I.waitForText('You must enter a surname for the user');
    I.waitForText('You must select an user type');
    I.fillField('#forename', ' ');
    I.fillField('#surname', ' ');
    I.click('Support');
    I.click('Continue');
    I.waitForText('You must enter a forename for the user');
    I.waitForText('You must enter a surname for the user');
    I.fillField('#forename', testConfig.USER_FIRSTNAME);
    I.fillField('#surname', testConfig.USER_LASTNAME);
    I.click('Support');
    I.click('Continue');
    I.see(ASSIGNABLE_CHILD_ROLE1);
    I.see(ASSIGNABLE_CHILD_ROLE2);
    I.see(PARENT_ROLE);
    I.click('Save');
    I.waitForText('There is a problem');
    I.waitForText('A user must have at least one role assigned to be able to create them');
  });

