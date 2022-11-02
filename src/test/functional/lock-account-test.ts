import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/testingSupportApi';

Feature('Lock User Account');
const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('I should be see a warning when viewing a user who is locked', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  I.createUserWithRoles(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [testConfig.USER_ROLE_CITIZEN]
  );
  I.lockAccountOf(userEmail);
  I.loginAs(DASHBOARD_USER_EMAIL);
  I.waitForText('Manage an existing user');
  I.gotoUserDetails(userEmail);
  I.see('This account has been temporarily locked due to multiple failed login attempts.');
});

Scenario('I should not see a warning when viewing a user who is not locked', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();
  const postResetPassword = testConfig.PASSWORD + randomData.getRandomString(2);

  I.createUserWithRoles(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [testConfig.USER_ROLE_CITIZEN]
  );
  I.lockAccountOf(userEmail);

  I.loginAs(userEmail);
  I.see('You can reset your password to unlock your account.');
  I.click('reset your password');
  I.see('Reset your password');
  I.fillField('#email', userEmail);
  I.click('Submit');
  I.waitForText('Check your email');

  const response = await I.extractUrlFromNotifyEmail(userEmail);
  const resetLink = response.body.match(/https:\/\/.*/);

  I.amOnPage(resetLink.toString());
  I.see('Enter new password');
  I.see('Repeat new password');
  I.fillField('#password1', postResetPassword);
  I.fillField('#password2', postResetPassword);
  I.click('Continue');
  I.see('Your password has been changed');

  I.loginAs(DASHBOARD_USER_EMAIL);
  I.waitForText('Manage an existing user');
  I.gotoUserDetails(userEmail);
  I.dontSee('This account has been temporarily locked due to multiple failed login attempts.');
});
