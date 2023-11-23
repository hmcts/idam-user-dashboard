import { LOGIN_URL, MANAGER_USER_URL } from '../../main/utils/urls';
import { config as testConfig } from '../config';

export = function () {
  return actor({
    loginAs: function (username, password = testConfig.PASSWORD) {
      let loginDone = false;
      for (let x = 0; x < 3 && !loginDone; x++) {
        let canSeeLogin = false;
        for (let i = 0; i < 3 && !canSeeLogin; i++) {
          this.amOnPage(LOGIN_URL);
          if (this.tryToSee('Sign in')) {
            canSeeLogin = true;
            this.say('I can see login page');
          } else {
            this.say('Failed to see login screen on attempt ' + i);
          }
        }
        this.see('Sign in');
        this.fillField('#username', username);
        this.fillField('#password', password);
        this.click('Sign in');
        this.seeInCurrentUrl(testConfig.TEST_URL);
        if (this.tryToSee('Our services aren’t available right now')) {
          this.say('Failed with services not available on attempt ' + x);
        else if (this.tryToSee('Sorry, there is a problem with the service')) {
          this.say('Failed with problem in service ' + x);
        } else {
          loginDone = true;
        }
      }
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
