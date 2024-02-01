// in this file you can append custom step methods to 'I' object

const AFTER_CLICK_RETRY = { retries: 9, minTimeout: 250 };

export = function() {
  return actor({
    loginAs(email : string, password : string) {
      this.amOnPage('/');
      this.fillField('Email', email);
      this.fillField('Password', secret(password));
      this.click('Sign in');  
      this.seeAfterClick('What do you want to do?');
    },
    navigateToManageUser(searchValue : string) {
      this.amOnPage('/');
      this.checkOption('Manage an existing user');
      this.click('Continue');
      this.seeInCurrentUrl('/user/manage');
      this.seeAfterClick('Search for an existing user', 'h1');
      this.fillField('search', searchValue);
      this.click('Search');
      this.seeInCurrentUrl('/details');
      this.seeAfterClick('User Details', 'h1');
    },
    navigateToEditUser(searchValue : string) {
      this.navigateToManageUser(searchValue);
      this.click('Edit user');
      this.seeInCurrentUrl('/user/edit');
      this.seeAfterClick('Edit User', 'h1');
    },
    seeAfterClick(seeValue : string, location) {
      this.retry(AFTER_CLICK_RETRY).see(seeValue, location);
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