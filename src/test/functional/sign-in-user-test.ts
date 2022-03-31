import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/testingSupportApi';

Feature('User Sign In');
const dashboardUserEMAIL = randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('I as a user with access role can sign in', async ({I}) => {
  await I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
}).tag('@CrossBrowser');

Scenario('I as a user without access role cannot access service and is shown error page', async ({I}) => {
  const activeUserEmail = randomData.getRandomEmailAddress();
  await I.createUserWithRoles(activeUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, []);

  I.amOnPage('/login');
  I.see('Sign in');
  I.fillField('#username', activeUserEmail);
  I.fillField('#password', testConfig.PASSWORD);
  I.click('Sign in');
  I.see('Sorry, access to this resource is forbidden');
  I.waitForText('Status code: 403');
});

Scenario('I as a user with citizen role cannot access service and is shown error page', async ({I}) => {
  const citizenUserEmail = randomData.getRandomEmailAddress();
  await I.createUserWithRoles(citizenUserEmail, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.USER_ROLE_CITIZEN]);

  I.amOnPage('/login');
  I.see('Sign in');
  I.fillField('#username', citizenUserEmail);
  I.fillField('#password', testConfig.PASSWORD);
  I.click('Sign in');
  I.see('Sorry, access to this resource is forbidden');
  I.waitForText('Status code: 403');
});

Scenario('I as a user try to sign in with invalid credentials', ({I}) => {
  I.amOnPage('/login');
  I.see('Sign in');
  I.fillField('#username', 'wronguser@wronguser.com');
  I.fillField('#password', 'WrongPassword');
  I.click('Sign in');
  I.waitForText('Incorrect email or password');
  I.see('Sign in');
  I.clearField('#username');
  I.clearField('#password');
  I.click('Sign in');
  I.waitForText('Information is missing or invalid');
});


