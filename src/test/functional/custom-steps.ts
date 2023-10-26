import { LOGIN_URL, MANAGER_USER_URL } from '../../main/utils/urls';
import { config as testConfig } from '../config';

export = function () {
  return actor({
    loginAs: function (username, password = testConfig.PASSWORD) {
      this.amOnPage(LOGIN_URL);
      this.see('Sign in');
      this.fillField('#username', username);
      this.fillField('#password', password);
      this.click('Sign in');
      this.seeInCurrentUrl(testConfig.TEST_URL);
    },
    logout: function () {
      this.click('Sign out');
      this.see('Sign in');
    },
    lockAccountOf: function (username) {
      const LOGIN_ATTEMPT_LIMIT = 5;
      this.amOnPage(LOGIN_URL);
      this.see('Sign in');
      this.fillField('#username', username);
      this.fillField('#password', 'SOME_WRONG_PASSWORD');

      for (let i = 0; i < LOGIN_ATTEMPT_LIMIT; i++) {
        this.click('Sign in');
        this.wait(1);

        if (i === LOGIN_ATTEMPT_LIMIT - 1) {
          this.see('There is a problem with your account login details');
          this.see('Your account is locked due to too many unsuccessful attempts.');
          this.see('You can reset your password to unlock your account.');
        } else {
          this.see('Incorrect email or password');
        }
      }
    },
    gotoUserDetails: function (id: string) {
      this.amOnPage(MANAGER_USER_URL);
      this.fillField('#search', id);
      this.click('Search');
      this.seeInCurrentUrl('/details');
      this.see('User Details');
      this.see(id);
    }
  });
};
