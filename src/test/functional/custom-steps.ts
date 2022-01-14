const config = require('../config.ts');

export = function () {
  return actor({

    loginAsSystemOwner: function () {
      this.loginAs(config.config.SMOKE_TEST_USER_USERNAME, config.config.SMOKE_TEST_USER_PASSWORD);
    },

    loginAs: function (username, password) {
      this.amOnPage('/login');
      this.see('Sign in');
      this.fillField('#username', username);
      this.fillField('#password', password);
      this.wait(5);
      this.click('Sign in');
      this.waitForText('Please select an option to continue');
    },
  });
};
