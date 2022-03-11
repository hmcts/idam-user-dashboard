import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/apiHelpers';

Feature('User Sign In');
const dashboardUserEMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('@CrossBrowser I as a user with access role can sign in', async ({I}) => {
  await I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
});

Scenario('I as a user without access role cannot access service and is shown error page', async ({I}) => {
  const activeUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  await createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, []);

  await I.amOnPage('/login');
  await I.see('Sign in');
  await I.fillField('#username', activeUserEmail);
  await I.fillField('#password', testConfig.PASSWORD);
  await I.click('Sign in');
  await I.see('Sorry, access to this resource is forbidden');
  await I.waitForText('Status code: 403');
});

Scenario('I as a user with citizen role cannot access service and is shown error page', async ({I}) => {
  const citizenUserEmail = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
  await createUserWithRoles(citizenUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);

  await I.amOnPage('/login');
  await I.see('Sign in');
  await I.fillField('#username', citizenUserEmail);
  await I.fillField('#password', testConfig.PASSWORD);
  await I.click('Sign in');
  await I.see('Sorry, access to this resource is forbidden');
  await I.waitForText('Status code: 403');
});

Scenario('I as a user try to sign in with invalid credentials', async ({I}) => {
  await I.amOnPage('/login');
  await I.see('Sign in');
  await I.fillField('#username', 'wronguser@wronguser.com');
  await I.fillField('#password', 'WrongPassword');
  await I.click('Sign in');
  await I.waitForText('Incorrect email or password');
  await I.see('Sign in');
  await I.clearField('#username');
  await I.clearField('#password');
  await I.click('Sign in');
  await I.waitForText('Information is missing or invalid');
});


