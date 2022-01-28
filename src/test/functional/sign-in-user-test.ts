import {config} from '../config';
import StringOrSecret = CodeceptJS.StringOrSecret;

Feature('User Sign In');

Scenario('I as an user can sign in', ({I}) => {
  I.amOnPage('/login');
  I.see('Sign in');
  I.fillField('#username', config.SMOKE_TEST_USER_USERNAME as StringOrSecret);
  I.fillField('#password', config.SMOKE_TEST_USER_PASSWORD as StringOrSecret);
  I.click('Sign in');
  I.waitForText('Manage existing users');
}).retry(config.SCENARIO_RETRY_LIMIT);

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
}).retry(config.SCENARIO_RETRY_LIMIT);

