const TestData = require('../test_data');

Feature('User Signin');

Scenario('I as an user can signin', ({ I }) => {
  I.amOnPage('/login');
  I.wait(10);
  I.see('Sign in');
  I.fillField('#username', 'idamOwner@hmcts.net');
  I.fillField('#password', 'Pa55word11');
  I.fillField('#username', TestData.SMOKE_TEST_USER_USERNAME);
  I.fillField('#password', TestData.SMOKE_TEST_USER_PASSWORD);
  I.click('Sign in');
  I.waitForText('What do you want to do?');

}).retry(TestData.SCENARIO_RETRY_LIMIT);

Scenario('I as an user try to signin with invalid credentials', ({ I }) => {
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
}).retry(TestData.SCENARIO_RETRY_LIMIT);
