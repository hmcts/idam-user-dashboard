// in this file you can append custom step methods to 'I' object

const CLICK_RETRY = { retries: 3, minTimeout: 500, maxTimeout: 5000 };
const AFTER_CLICK_RETRY = { retries: 9, minTimeout: 300 };

export = function() {
  return actor({
    doLogin(email : string, password : string) {
      this.amOnPage('/');
      this.retry(AFTER_CLICK_RETRY).seeElement('h1');
      this.retry(AFTER_CLICK_RETRY).see('Sign in', 'h1');
      this.fillField('Email', email);
      this.fillField('Password', secret(password));
      this.retry(CLICK_RETRY).click('Sign in');
      this.retry(AFTER_CLICK_RETRY).dontSee('Sign in', 'h1');
      this.retry(AFTER_CLICK_RETRY).seeElement('h1');
      this.retry(AFTER_CLICK_RETRY).see('What do you want to do?', 'h1');
    },
    loginAs(email : string, password : string) {
      tryTo(() => this.doLogin(email, password));
      tryTo(() => {
        this.dontSee('What do you want to do?', 'h1');
        this.doLogin(email, password);
      });
    },
    async goToPage(expectedUrl: String, expectedHeading? : String) {
      tryTo(() => this.amOnPage(expectedUrl));
      tryTo(() => this.waitForElement('h1', 3));
      let currentHeading = await this.grabTextFrom('h1');
      if (!currentHeading || currentHeading.trim() != expectedHeading) {
        this.say('failed to reach expected page on first attempt');
        this.amOnPage(expectedUrl);
        await this.retry(AFTER_CLICK_RETRY).seeElement('h1');
        await this.retry(AFTER_CLICK_RETRY).see(expectedHeading, 'h1');
      } else {
        await this.see(expectedHeading, 'h1');
      }
    },
    async navigateToManageUser(searchValue : string) {
      await this.navigateToSearchUser();
      await this.retry(AFTER_CLICK_RETRY).fillField('search', searchValue);
      await this.clickToNavigate('Search', '/details', 'User Details');
    },
    async navigateToSearchUser() {
      await this.goToPage('/', 'What do you want to do?');
      await this.checkOption('Manage an existing user');
      await this.clickToNavigate('Continue', '/user/manage', 'Search for an existing user');
    },
    async navigateToEditUser(searchValue : string) {
      await this.navigateToManageUser(searchValue);
      await this.clickToNavigate('Edit user', '/user/edit', 'Edit User');
    },
    async navigateToGenerateReport() {
      await this.goToPage('/', 'What do you want to do?');
      await this.checkOption('Generate a user report');
      await this.clickToNavigate('Continue', '/reports', 'Generate report');
    },
    async navigateToRegisterUser() {
      await this.goToPage('/', 'What do you want to do?');
      await this.checkOption('Add a new user');
      await this.clickToNavigate('Continue', '/user/add', 'Add new user email');
    },
    seeAfterClick(seeValue : string, location) {
      this.retry(AFTER_CLICK_RETRY).see(seeValue, location);
    },
    async clickToNavigate(clickText : String, expectedUrl : String, expectedHeading? : String) {
      const originalHeading : String = await this.grabTextFrom('h1');
      await this.retry(CLICK_RETRY).click(clickText);
      await tryTo(() => {
        this.see('Bad Gateway');
        this.say('Oh no, there is a bad gateway. Let me try again');
        this.wait(1);
        this.refreshPage();
      });
      await this.retry(AFTER_CLICK_RETRY).dontSee(originalHeading.trim(), 'h1');
      await this.retry(AFTER_CLICK_RETRY).seeInCurrentUrl(expectedUrl);
      await this.retry(AFTER_CLICK_RETRY).seeElement('h1');
      if (expectedHeading) {
        await this.retry(AFTER_CLICK_RETRY).see(expectedHeading, 'h1');
      }
    },
    async clickToExpectProblem(clickText : String) {
      await this.retry(CLICK_RETRY).click(clickText);
      await tryTo(() => {
        this.see('Bad Gateway');
        this.say('Oh no, there is a bad gateway. Let me try again');
        this.wait(1);
        this.refreshPage();
      });
      await this.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    },
    async clickToExpectSuccess(clickText : String) {
      await this.retry(CLICK_RETRY).click(clickText);
      await tryTo(() => {
        this.see('Bad Gateway');
        this.say('Oh no, there is a bad gateway. Let me try again');
        this.wait(1);
        this.refreshPage();
      });
      await this.seeAfterClick('Success', locate('h2.govuk-notification-banner__title'));
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
      await this.seeResponseCodeIsSuccessful();
      await this.assertEqual(invitationRsp.data.length, 1);
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
    locateRoleContainer(locateValue: string) {
      return locate('div').withChild(this.locateInput('roles', locateValue));
    },
    async seeIsHidden(location) {
      const numVisible = await this.grabNumberOfVisibleElements(location);
      await this.assertTrue(numVisible == 0, 'Visible elements matching locator: ' + numVisible);
      return numVisible == 0;
    },
    async seeIsNotHidden(location) {
      const numVisible = await this.grabNumberOfVisibleElements(location);
      await this.assertTrue(numVisible > 0, 'Visible elements matching locator: ' + numVisible);
      return numVisible > 0;
    },
    async seeIgnoreCase(expectedValue: string, location) {
      const actualValue = await this.grabTextFrom(location);
      await this.assertEqualIgnoreCase(actualValue, expectedValue);
    },
    async haveUser(body = null) {
      const rsp = await this.have('user', body);
      // error responses will always have a path attribute
      if (rsp.path) {
        this.say('Failed to create user with status: %s, will try again >> %j', rsp.status, rsp);
        return await this.safeHave('user', body);
      }
      return rsp;
    },
    async haveRole(body = null) {
      return await this.safeHave('role', body);
    },
    async haveService(body = null) {
      return await this.safeHave('service', body);
    },
    async safeHave(type, body = null) {
      const rsp = await this.have(type, body);
      // error responses will always have a path attribute
      if (rsp.path) {
        console.log('error creating %s: %j', type, rsp);
        await this.assertEqual(rsp.status, 201);
      }
      return rsp;
    },
    checkA11y(fileName: string) {
      this.runA11yCheck({ reportFileName: fileName });
    },
  });
}
