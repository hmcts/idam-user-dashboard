import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles, createUserWithSsoId} from './shared/testingSupportApi';

Feature('Search User');

const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();
const CITIZEN_USER_EMAIL = randomData.getRandomEmailAddress();
const CONFLICT_USER_EMAIL = randomData.getRandomEmailAddress();
let citizenUser;
let conflictUser;

BeforeSuite(async () => {
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
  citizenUser = await createUserWithSsoId(CITIZEN_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], randomData.getRandomSSOId());
  conflictUser = await createUserWithSsoId(CONFLICT_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN], citizenUser.id);
});

const incorrectEmailAddresses = new DataTable(['incorrectEmailAddress']);
incorrectEmailAddresses.add(['email..@test.com']); // adding records to a table
incorrectEmailAddresses.add(['email@']);
incorrectEmailAddresses.add(['email@com']);

Data(incorrectEmailAddresses).Scenario('I as a user should be able to see proper error message if search text is not in the right format',
  async ({I, current}) => {
    I.tryLoginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
    I.see('Manage an existing user');
    I.click('Manage an existing user');
    I.click('Continue');
    I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', current.incorrectEmailAddress);
    I.click('Search');
    I.seeElement('#search-error');
    I.see('The email address is not in the correct format');
  });

Scenario('I should be able to search with user-email', async ({I}) => {
  I.tryLoginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.see('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', CITIZEN_USER_EMAIL);
  I.click('Search');
  I.see('User Details');
  I.see('ACTIVE');
  I.see(CITIZEN_USER_EMAIL);
  I.see(testConfig.USER_FIRSTNAME);
  I.see(testConfig.USER_LASTNAME);
  I.see(testConfig.USER_ROLE_CITIZEN);
}).tag('@CrossBrowser');

Scenario('I should be able to search with user-id', async ({I}) => {
  I.tryLoginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.see('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', citizenUser.id);
  I.click('Search');
  I.see('User Details');
  I.see('ACTIVE');
  I.see(CITIZEN_USER_EMAIL);
  I.see(testConfig.USER_FIRSTNAME);
  I.see(testConfig.USER_LASTNAME);
  I.see(testConfig.USER_ROLE_CITIZEN);
}).tag('@CrossBrowser');

Scenario('I should be able to search with sso-id', async ({I}) => {
  I.tryLoginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.see('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', citizenUser.ssoId);
  I.click('Search');
  I.see('User Details');
  I.see('ACTIVE');
  I.see(CITIZEN_USER_EMAIL);
  I.see(testConfig.USER_FIRSTNAME);
  I.see(testConfig.USER_LASTNAME);
  I.see(testConfig.USER_ROLE_CITIZEN);
}).tag('@CrossBrowser');

Scenario('When there is a collision between user-id and sso-id, user details should be shown based on user-id', async ({I}) => {
  I.tryLoginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.see('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', conflictUser.ssoId);
  I.click('Search');
  I.see('User Details');
  I.see(citizenUser.id);
});

Scenario('I as a user should be able to see proper error message if search text left blank', async ({I}) => {
  I.tryLoginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.see('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('Search');
  I.seeElement('#search-error');
  I.see('You must enter an email address');
  I.fillField('#search', ' ');
  I.click('Search');
  I.seeElement('#search-error');
  I.see('You must enter an email address');
});

Scenario('I as a user should be able to see proper error message if user does not exist', async ({I}) => {
  I.tryLoginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.see('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', 'meTesting@test.com');
  I.click('Search');
  I.see('No user matches your search for: meTesting@test.com');
});
