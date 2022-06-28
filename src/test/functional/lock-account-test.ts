import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/testingSupportApi';

Feature('Lock User Account');
const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();
const TEST_USER_EMAIL = randomData.getRandomEmailAddress();
const AFTER_RESET_PASSWORD = testConfig.PASSWORD + randomData.getRandomString(2);

BeforeSuite(async () => {
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
  await createUserWithRoles(TEST_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('User details page should reflect users locked status and active status when unlocked', async ({I}) => {
  I.amOnPage('/login');
  I.see('Sign in');
  I.fillField('#username', TEST_USER_EMAIL);
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

  I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', TEST_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  I.see('This account has been temporarily locked due to multiple failed login attempts. The temporary lock will end in 60 minutes');
  I.click('Sign out');

  I.loginAs(TEST_USER_EMAIL, testConfig.PASSWORD);
  I.waitForText('You can reset your password to unlock your account.');
  I.click('reset your password');
  I.waitForText('Reset your password');
  I.fillField('#email', TEST_USER_EMAIL);
  I.click('Submit');
  I.waitForText('Check your email');

  const response = await I.extractUrlFromNotifyEmail(TEST_USER_EMAIL);
  const resetLink = response.body.match(/https:\/\/.*/);

  I.amOnPage(resetLink.toString());
  I.waitForText('Enter new password');
  I.waitForText('Repeat new password');
  I.fillField('#password1', AFTER_RESET_PASSWORD);
  I.fillField('#password2', AFTER_RESET_PASSWORD);
  I.click('Continue');
  I.waitForText('Your password has been changed');

  I.loginAs(DASHBOARD_USER_EMAIL, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
  I.click('Manage an existing user');
  I.click('Continue');
  I.waitForText('Please enter the email address, user ID or SSO ID of the user you wish to manage');
  I.click('#search');
  I.fillField('#search', TEST_USER_EMAIL);
  I.click('Search');
  I.waitForText('User Details');
  I.see('ACTIVE');
  I.dontSee('This account has been temporarily locked due to multiple failed login attempts.');
});
