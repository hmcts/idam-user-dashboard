import { config as testConfig, testAccounts } from '../config';

export = function () {
  return actor({

    loginAsSystemOwner: function () {
      this.loginAs(testConfig.SMOKE_TEST_USER_USERNAME, testConfig.SMOKE_TEST_USER_PASSWORD);
    },
    loginAsSuperUser: function () {
      this.loginAs(testAccounts.superUser.email, testAccounts.superUser.password);
    },
    loginAsAdminUser: function () {
      this.loginAs(testAccounts.adminUser.email, testAccounts.adminUser.password);
    },

    loginAs: function (username, password) {
      this.amOnPage('/login');
      this.see('Sign in');
      this.fillField('#username', username);
      this.fillField('#password', password);
      this.click('Sign in');
      this.waitForText('Manage existing users');
    },
  });
};
