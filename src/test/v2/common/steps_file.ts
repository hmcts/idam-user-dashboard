// in this file you can append custom step methods to 'I' object

const AFTER_CLICK_RETRY = { retries: 9, minTimeout: 250 };

export = function() {
  return actor({

    getPage() {
      return this.getPage;
    },

    loginAs(email : string, password : string) {
      this.amOnPage('/');
      this.fillField('Email', email);
      this.fillField('Password', secret(password));
      this.click('Sign in');  
      this.seeAfterClick('What do you want to do?');
    },
    navigateToManageUser(searchValue : string) {
      this.navigateToSearchUser();
      this.fillField('search', searchValue);
      this.click('Search');
      this.seeInCurrentUrl('/details');
      this.seeAfterClick('User Details', 'h1');
    },
    navigateToSearchUser() {
      this.amOnPage('/');
      this.checkOption('Manage an existing user');
      this.click('Continue');
      this.seeInCurrentUrl('/user/manage');
      this.seeAfterClick('Search for an existing user', 'h1');
    },
    navigateToEditUser(searchValue : string) {
      this.navigateToManageUser(searchValue);
      this.click('Edit user');
      this.seeInCurrentUrl('/user/edit');
      this.seeAfterClick('Edit User', 'h1');
    },
    navigateToGenerateReport() {
      this.amOnPage('/');
      this.checkOption('Generate a user report');
      this.click('Continue');
      this.seeAfterClick('Generate report', 'h1');
    },
    navigateToRegisterUser() {
      this.amOnPage('/');
      this.checkOption('Add a new user');
      this.click('Continue');
      this.seeInCurrentUrl('/user/add');
      this.seeAfterClick('Add new user email', 'h1');
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
    },
    async getSingleInvite(email: string, token: string) {
      this.amBearerAuthenticated(token);
      const invitationRsp = await this.sendGetRequest('/test/idam/invitations?email=' + email);
      this.seeResponseCodeIsSuccessful();
      this.assertEqual(invitationRsp.data.length, 1);
      return invitationRsp.data[0];
    },
    locateDataForTitle(title: string) {
      return locate('dd').after(locate('dt').withText(title).as(title));
    },
    locateStrongDataForTitle(title: string) {
      return locate('strong').inside(locate('dd').after(locate('dt').withText(title)).as(title));
    },
    locateTitle(title: string) {
      return locate('dt').withText(title).as(title);
    },
    locateInput(locateName: string, locateValue: string) {
      return locate('input').withAttr({name: locateName, value: locateValue});
    },
    async seeIgnoreCase(expectedValue: string, location) {
      const actualValue = await this.grabTextFrom(location);
      this.assertEqualIgnoreCase(actualValue, expectedValue);
    }
  });
}
