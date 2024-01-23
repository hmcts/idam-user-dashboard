// in this file you can append custom step methods to 'I' object

export = function() {
  return actor({
    loginAs(email : string, password : string) {
      this.amOnPage('/');
      this.fillField('Email', email);
      this.fillField('Password', secret(password));
      this.click('Sign in');  
      this.retry(3).see('What do you want to do?');
    },
    navigateToManageUser(searchValue : string) {
      this.amOnPage('/');
      this.checkOption('Manage an existing user');
      this.click('Continue');
      this.seeInCurrentUrl('/user/manage');
      this.retry(3).see('Search for an existing user', 'h1');
      //this.retry(3).seeElement('input[name=search]');
      this.fillField('search', searchValue);
      this.click('Search');
      this.seeInCurrentUrl('/details');
      //this..waitForText('User Details', '.h1'); // can cause screenshot problem
      this.retry(3).see('User Details', 'h1');
    },
    lockTestUser(email : string) {
      for (let i=0; i<5; i++) {
        this.sendPostRequest('https://idam-api.aat.platform.hmcts.net/o/token', { 
          'grant_type':'password',
          'client_id':'idam-functional-test-service',
          'client_secret': process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET,
          'scope':'profile roles',
          'username':email,
          'password':'invalid'
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        });
        this.wait(1);
      }
    }
  });
}
