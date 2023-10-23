import { LOGIN_URL, MANAGER_USER_URL } from '../../main/utils/urls';
import { config as testConfig } from '../config';
import error = CodeceptJS.output.error;
import {loginUsingPasswordGrant} from './shared/testingSupportApi';

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
    lockAccountOf: async function (username) {
      const LOGIN_ATTEMPT_LIMIT = 8;

      console.error('****************');
      for (let i = 0; i < LOGIN_ATTEMPT_LIMIT; i++) {
        console.error('****************'+username);

        loginUsingPasswordGrant(username).then((data) => {
          console.error('****************'+'success'+data.response);
        }).catch((error) => {
          console.error(error.response.data.error_description);

        });
        this.wait(1);

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
