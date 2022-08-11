export = function () {
  return actor({
    loginAs: function (username, password) {
      this.amOnPage('/login');
      this.see('Sign in');
      this.fillField('#username', username);
      this.fillField('#password', password);
      this.click('Sign in');
    },
    logout: function () {
      this.click('Sign out');
      this.see('Sign in');
    }
  });
};
