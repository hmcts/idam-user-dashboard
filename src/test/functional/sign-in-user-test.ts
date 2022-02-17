import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/apiHelpers';

Feature('User Sign In');
const dashboardUserEMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, []);
});

Scenario('@CrossBrowser I as a user can sign in', ({I}) => {
  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
});

Scenario('I as an user try to sign in with invalid credentials', ({I}) => {
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

