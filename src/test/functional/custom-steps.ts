import {config} from '../config';

export = function () {
  return actor({

    loginAsSystemOwner: function () {
      this.loginAs(config.SMOKE_TEST_USER_USERNAME, config.SMOKE_TEST_USER_PASSWORD);
    },

    loginAs: function (username, password) {
      this.amOnPage('/login');
      this.see('Sign in');
      this.fillField('#username', username);
      this.fillField('#password', password);
      this.click('Sign in');
      this.waitForText('Please select an option to continue');
    },
  });
};
