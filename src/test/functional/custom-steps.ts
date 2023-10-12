import { LOGIN_URL, MANAGER_USER_URL } from '../../main/utils/urls';
import { config as testConfig } from '../config';
import {loginAsUser, loginUser} from './shared/testingSupportApi';
import {response} from 'express';


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
      for (let i = 0; i < LOGIN_ATTEMPT_LIMIT; i++) {
        loginUser(username,'InvalidPassword%')
          .then((response) => {
            // Access the response data and print it
            console.log('Response Data:', response.data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
        console.error(response);
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
