import {config} from '../config';
import StringOrSecret = CodeceptJS.StringOrSecret;

Feature('User Sign In');

Scenario('I as an system owner should be able to manage the users', ({I}) => {

  I.amOnPage('/login');
  I.see('Sign in');
  I.fillField('#username', config.SMOKE_TEST_USER_USERNAME as StringOrSecret);
  I.fillField('#password', config.SMOKE_TEST_USER_PASSWORD as StringOrSecret);
  I.wait(5);
  I.click('Sign in');
  I.waitForText('Please select an option to continue');
  I.click('Manage existing users');
  I.wait(5);
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
}).retry(config.SCENARIO_RETRY_LIMIT);

