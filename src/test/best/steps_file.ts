// in this file you can append custom step methods to 'I' object

export = function() {
  return actor({
    loginAs(email, password) {
      this.amOnPage('/');
      this.fillField('Email', email);
      this.fillField('Password', secret(password));
      this.click('Sign in');  
    },
    navigateToManageUser(searchValue) {
      this.amOnPage('/');
      this.checkOption('Manage an existing user');
      this.click('Continue');
      this.seeInCurrentUrl('/user/manage');
      this.fillField('#search', searchValue);
      this.retry(3).see('Search for an existing user', 'h1');
      this.click('Search');
      this.seeInCurrentUrl('/details');
      //this.retry(3).waitForText('User Details', '.h1'); // can cause screenshot problem
      this.retry(3).see('User Details', 'h1');
    }
  });
}
