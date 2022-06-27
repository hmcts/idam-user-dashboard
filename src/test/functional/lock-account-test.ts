import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/testingSupportApi';

Feature('Lock User Account');
const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();
const AFTER_RESET_PASSWORD = testConfig.PASSWORD + randomData.getRandomString(2);
BeforeSuite(async () => {
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('I as a user when try to sign in should get locked after 5 login attempts with wrong password and should be able to login once I reset my password', async ({I}) => {
  I.amOnPage('/login');
  I.see('Sign in');
  I.fillField('#username', DASHBOARD_USER_EMAIL);
  I.fillField('#password', 'WrongPassword@5');
  I.click('Sign in');
  I.waitForText('Incorrect email or password');
  I.see('Sign in');
  I.click('Sign in');
  I.waitForText('Incorrect email or password');
  I.see('Sign in');
  I.click('Sign in');
  I.waitForText('Incorrect email or password');
  I.see('Sign in');
  I.click('Sign in');
  I.waitForText('Incorrect email or password');
  I.see('Sign in');
  I.click('Sign in');
  I.waitForText('There is a problem with your account login details');
  I.waitForText('Your account is locked due to too many unsuccessful attempts.');
  I.waitForText('You can reset your password to unlock your account.');
  I.click('reset your password');
  I.waitForText('Reset your password');
  I.fillField('#email', DASHBOARD_USER_EMAIL);
  I.click('Submit');
  I.waitForText('Check your email');

  const response = await I.extractUrlFromNotifyEmail(DASHBOARD_USER_EMAIL);
  const resetLink = response.body.match(/https:\/\/.*/);

  I.amOnPage(resetLink.toString());
  I.waitForText('Enter new password');
  I.waitForText('Repeat new password');
  I.fillField('#password1', AFTER_RESET_PASSWORD);
  I.fillField('#password2', AFTER_RESET_PASSWORD);
  I.click('Continue');
  I.waitForText('Your password has been changed');
  I.loginAs(DASHBOARD_USER_EMAIL, AFTER_RESET_PASSWORD);
  I.waitForText('Manage an existing user');
});
