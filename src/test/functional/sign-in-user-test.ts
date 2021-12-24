const signInConfig = require('../config');

Feature('User Sign In');

Scenario('I as an user can sign in', ({I}) => {
  I.amOnPage('/login');
  I.see('Sign in');
  I.fillField('#username', signInConfig.SMOKE_TEST_USER_USERNAME);
  I.fillField('#password', signInConfig.SMOKE_TEST_USER_PASSWORD);
  I.fillField('#username', 'idamOwner@hmcts.net');
  I.wait(5);
  I.fillField('#password', 'Pa55word11');
  I.click('Sign in');
  I.waitForText('What do you want to do?');

}).retry(signInConfig.SCENARIO_RETRY_LIMIT);

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
}).retry(signInConfig.SCENARIO_RETRY_LIMIT);
