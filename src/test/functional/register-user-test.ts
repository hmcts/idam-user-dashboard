import {
  assignRolesToParentRole,
  createAssignableRoles,
  createService,
  createUserWithRoles
} from './shared/testingSupportApi';
import '../../main/utils/utils';
import {config as testConfig} from '../config';
import * as Assert from 'assert';
import {randomData} from './shared/random-data';
import {BETA_ADD, GAMMA_PRIVATE_BETA} from '../../main/app/feature-flags/flags';

Feature('Register New User');

const PARENT_ROLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE1 = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE2 = randomData.getRandomRole();
const INDEPENDENT_ROLE = randomData.getRandomRole();
const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();
const SERVICE_WITH_PRIVATE_BETA = randomData.getRandomRole();
const PRIVATE_BETA_ROLE = randomData.getRandomRole();
const SERVICE_WITH_UNASSIGNED_PRIVATE_BETA_ROLE = randomData.getRandomRole();

const OAUTH_REDIRECT_URI = 'http://test.com/oauth2/callback';

BeforeSuite(async () => {
  await createAssignableRoles(PARENT_ROLE);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE1);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE2);
  await createAssignableRoles(PRIVATE_BETA_ROLE);
  await createAssignableRoles(INDEPENDENT_ROLE);
  // Assigning self role with the child role so the this user can also delete same level users
  await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE1, ASSIGNABLE_CHILD_ROLE2, PARENT_ROLE, PRIVATE_BETA_ROLE, testConfig.USER_ROLE_CITIZEN]);
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
  await createService(SERVICE_WITH_PRIVATE_BETA, SERVICE_WITH_PRIVATE_BETA, SERVICE_WITH_PRIVATE_BETA, SERVICE_WITH_PRIVATE_BETA, [OAUTH_REDIRECT_URI], [PRIVATE_BETA_ROLE]);
  await createService(SERVICE_WITH_UNASSIGNED_PRIVATE_BETA_ROLE, SERVICE_WITH_UNASSIGNED_PRIVATE_BETA_ROLE, SERVICE_WITH_UNASSIGNED_PRIVATE_BETA_ROLE, SERVICE_WITH_UNASSIGNED_PRIVATE_BETA_ROLE, [OAUTH_REDIRECT_URI], [INDEPENDENT_ROLE]);
});

Scenario('I as a user should be able to register new support user',
  {featureFlags: [BETA_ADD]},
  async ({I}) => {
    const registerUserEmail = randomData.getRandomEmailAddress();
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.see('Manage an existing user');
    I.see('Add a new user');
    I.click('Add a new user');
    I.click('Continue');
    I.see('Please enter an email address');
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
    I.see('User registered');

    const response = await I.extractUrlFromNotifyEmail(registerUserEmail);
    const activationParams = response.body.match(/token=(.*?)&code=([a-zA-Z0-9\\-]+)/);
    const token = activationParams[1];
    const code = activationParams[2];
    await I.activateUserAccount(code, token);

    I.click('Return to main menu');
    I.click('Manage an existing user');
    I.click('Continue');
    I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', registerUserEmail);
    I.click('Search');
    I.see('User Details');
    I.see(registerUserEmail);
  }).tag('@CrossBrowser');

Scenario('I as a user should be able to register new private beta citizen user',
  {featureFlags: [BETA_ADD, GAMMA_PRIVATE_BETA]},
  async ({I}) => {
    const registerUserEmail = randomData.getRandomEmailAddress();
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.see('Manage an existing user');
    I.see('Add a new user');
    I.click('Add a new user');
    I.click('Continue');
    I.see('Please enter an email address');
    I.click('#email');
    I.fillField('#email', registerUserEmail);
    I.click('Continue');
    I.see('First name');
    I.see('Last name');
    I.see('Select user type');
    I.fillField('#forename', testConfig.USER_FIRSTNAME);
    I.fillField('#surname', testConfig.USER_LASTNAME);
    I.click('Private Beta Citizen');
    I.click('Continue');

    I.see('Please select a service you would want to associate with the private beta citizen');
    I.selectOption('#service', SERVICE_WITH_PRIVATE_BETA);
    I.click('Save');
    I.see('User registered');

    const response = await I.extractUrlFromNotifyEmail(registerUserEmail);
    const activationParams = response.body.match(/token=(.*?)&code=([a-zA-Z0-9\\-]+)/);
    const token = activationParams[1];
    const code = activationParams[2];
    await I.activateUserAccount(code, token);

    I.click('Return to main menu');
    I.click('Manage an existing user');
    I.click('Continue');
    I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', registerUserEmail);
    I.click('Search');
    I.see('User Details');
    I.see(registerUserEmail);
  });

Scenario('I as a user should be able to search for roles',
  {featureFlags: [BETA_ADD]},
  async ({I}) => {
    const registerUserEmail = randomData.getRandomEmailAddress();
    const searchText = ASSIGNABLE_CHILD_ROLE2.substring(0, 10);
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.see('Manage an existing user');
    I.see('Add a new user');
    I.click('Add a new user');
    I.click('Continue');
    I.see('Please enter an email address');
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

Data(incorrectEmailAddresses).Scenario('I as a user should see proper error message when register users email format is not correct',
  {featureFlags: [BETA_ADD]},
  async ({I, current}) => {
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.see('Manage an existing user');
    I.see('Add a new user');
    I.click('Add a new user');
    I.click('Continue');
    I.see('Please enter an email address');
    I.click('#email');
    I.fillField('#email', current.incorrectEmailAddress);
    I.click('Continue');
    I.see('The email address is not in the correct format');
  });

Scenario('I as a user should be able to see proper error messages when add-user validations are not met',
  {featureFlags: [BETA_ADD]},
  async ({I}) => {
    const registerUserEmail = randomData.getRandomEmailAddress();
    I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.see('Manage an existing user');
    I.see('Add a new user');
    I.click('Add a new user');
    I.click('Continue');
    I.see('Please enter an email address');
    I.click('Continue');
    I.see('There is a problem');
    I.see('You must enter an email address');
    I.fillField('#email', ' ');
    I.click('Continue');
    I.see('There is a problem');
    I.see('You must enter an email address');
    I.fillField('#email', DASHBOARD_USER_EMAIL);
    I.click('Continue');
    I.see(`The email '${DASHBOARD_USER_EMAIL}' already exists`);
    I.clearField('#email');
    I.fillField('#email', registerUserEmail);
    I.click('Continue');
    I.see('First name');
    I.see('Last name');
    I.see('Select user type');
    I.click('Continue');
    I.see('You must enter a forename for the user');
    I.see('You must enter a surname for the user');
    I.see('You must select an user type');
    I.fillField('#forename', ' ');
    I.fillField('#surname', ' ');
    I.click('Support');
    I.click('Continue');
    I.see('You must enter a forename for the user');
    I.see('You must enter a surname for the user');
    I.fillField('#forename', testConfig.USER_FIRSTNAME);
    I.fillField('#surname', testConfig.USER_LASTNAME);
    I.click('Support');
    I.click('Continue');
    I.see(ASSIGNABLE_CHILD_ROLE1);
    I.see(ASSIGNABLE_CHILD_ROLE2);
    I.see(PARENT_ROLE);
    I.click('Save');
    I.see('There is a problem');
    I.see('A user must have at least one role assigned to be able to create them');
  });

