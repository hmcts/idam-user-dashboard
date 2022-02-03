import {config} from '../config';

Feature('User Sign In');

Scenario('I as a user can sign in', ({I}) => {
  I.loginAs(config.SMOKE_TEST_USER_USERNAME, config.SMOKE_TEST_USER_PASSWORD);
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

