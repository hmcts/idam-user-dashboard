// in this file you can append custom step methods to 'I' object
const { faker } = require('@faker-js/faker');

const CLICK_RETRY = { retries: 3, minTimeout: 500, maxTimeout: 5000 };
const AFTER_CLICK_RETRY = { retries: 9, minTimeout: 300 };

export = function() {
  return actor({
    doLogin(email : string, password : string) {
      this.amOnPage('/');
      this.retry(AFTER_CLICK_RETRY).seeElement('h1');
      tryTo(() => {
        this.see('Sign in', 'h1');
        this.doClassicLogin(email, password);
      });
      tryTo(() => {
        this.see('Enter your email address', 'h1');
        this.doModernLogin(email, password);
      });
    },
    doClassicLogin(email : string, password : string) {
      this.say('Classic login');
      this.retry(AFTER_CLICK_RETRY).see('Sign in', 'h1');
      this.fillField('Email', email);
      this.fillField('Password', secret(password));
      this.retry(CLICK_RETRY).click('Sign in');
      this.retry(AFTER_CLICK_RETRY).dontSee('Sign in', 'h1');
      this.retry(AFTER_CLICK_RETRY).seeElement('h1');
      this.retry(AFTER_CLICK_RETRY).see('What do you want to do?', 'h1');
    },
    doModernLogin(email : string, password : string) {
      this.say('Modern login');
      this.retry(AFTER_CLICK_RETRY).see('Enter your email address', 'h1');
      this.fillField('email', email);
      this.retry(CLICK_RETRY).click('Continue');
      this.retry(AFTER_CLICK_RETRY).see('Enter your password', 'h1');
      this.fillField('password', secret(password));
      this.retry(CLICK_RETRY).click('Continue');
      this.retry(AFTER_CLICK_RETRY).dontSee('Enter your password', 'h1');
      this.retry(AFTER_CLICK_RETRY).seeElement('h1');
      this.retry(AFTER_CLICK_RETRY).see('What do you want to do?', 'h1');
    },
    loginAs(email : string, password : string) {
      tryTo(() => this.doLogin(email, password));
      tryTo(() => {
        this.dontSee('What do you want to do?', 'h1');
        this.doLogin(email, password);
      });
      this.retry(AFTER_CLICK_RETRY).see('What do you want to do?', 'h1');
    },
    async goToPage(expectedUrl: String, expectedHeading? : String) {
      tryTo(() => this.amOnPage(expectedUrl));
      const foundHeading = await tryTo(() => this.waitForElement('h1', 3));
      let currentHeading;
      if (foundHeading) {
        currentHeading = await this.grabTextFrom('h1');
      }
      if (!currentHeading || currentHeading.trim() != expectedHeading) {
        this.say('failed to reach expected page on first attempt');
        this.amOnPage(expectedUrl);
        await this.retry(AFTER_CLICK_RETRY).seeElement('h1');
        await this.retry(AFTER_CLICK_RETRY).see(expectedHeading, 'h1');
      } else {
        await this.see(expectedHeading, 'h1');
      }
    },
    async goToManageUser(userId: String) {
      const viewUserPath = '/user/' + userId + '/details';
      await this.goToPage(viewUserPath, 'User Details');
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
      await this.goToManageUser(searchValue);
      await this.clickToNavigate('Edit user', '/user/edit', 'Edit User');
    },
    async navigateToGenerateReport() {
      await this.goToPage('/', 'What do you want to do?');
      await this.checkOption('Generate a user report');
      await this.clickToNavigate('Continue', '/reports', 'Generate report');
    },
    async goToRegisterUser() {
      await this.amOnPage('/user/add', 'Add new user email');
    },
    async navigateToRegisterUser() {
      await this.goToPage('/', 'What do you want to do?');
      await this.checkOption('Add a new user');
      await this.clickToNavigate('Continue', '/user/add', 'Add new user email');
    },
    seeAfterClick(seeValue : string, location) {
      this.retry(AFTER_CLICK_RETRY).see(seeValue, location);
    },
    async clickToNavigateWithNoRetry(clickText : String, expectedUrl : String, expectedHeading? : String) {
      const originalHeading : String = await this.grabTextFrom('h1');
      await this.retry(CLICK_RETRY).click(clickText);
      await this.retry(AFTER_CLICK_RETRY).dontSee(originalHeading.trim(), 'h1');
      await this.retry(AFTER_CLICK_RETRY).seeInCurrentUrl(expectedUrl);
      await this.retry(AFTER_CLICK_RETRY).seeElement('h1');
      if (expectedHeading) {
        await this.retry(AFTER_CLICK_RETRY).see(expectedHeading, 'h1');
      }
    },
    async clickToNavigate(clickText : String, expectedUrl : String, expectedHeading? : String) {
      const originalHeading : String = await this.grabTextFrom('h1');
      await this.retry(CLICK_RETRY).click(clickText);
      const foundHeading = await tryTo(() => this.waitForElement('h1', 3));
      if (!foundHeading) {
        this.say('RETRY: No heading on page, going back to try again');
        const screenshotName =  'click-failure-' + faker.number.int();
        this.say('RETRY: Saving screenshot with name ' + screenshotName);
        await this.saveScreenshot(screenshotName);
        const pageSource = await this.grabSource();
        if (pageSource) {
          console.log('RETRY: Failed page source: ' + pageSource);
          if (pageSource.includes('bad gateway')) {
            this.say('RETRY: Failed page source contains BAD GATEWAY (see console log)');
          }
        }
        await this.executeScript('window.history.back();');
        await this.wait(3);
        const onStartPage = await tryTo(() => this.see(originalHeading, 'h1'));
        if (onStartPage) {
          await this.retry(CLICK_RETRY).click(clickText);
          await this.wait(3);
        } else {
          const backUrl = await this.grabCurrentUrl();
          this.say('RETRY: looks like browser back button failed, url is now ' + backUrl);
          const backPageSource = await this.grabSource();
          if (backPageSource) {
            console.log('RETRY: Failed back page source: ' + pageSource);
            if (pageSource.includes('bad gateway')) {
              this.say('RETRY: After clicking back page source contains BAD GATEWAY (see console log)');
            }
          }
        }
      } 
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
        this.sendPostRequest(process.env.STRATEGIC_SERVICE_URL + '/o/token', {
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
    async archiveExistingTestUser(user: any) {
      user.recordType = 'ARCHIVED';
      const activateRequest = {
        password: 'redundant',
        user
      };
      return await this.sendPutRequest('/test/idam/users/' + user.id, activateRequest);
    },
    async getSingleInvite(email: string, token: string) {
      this.amBearerAuthenticated(token);
      const invitationRsp = await this.getWithRetry('/test/idam/invitations?email=' + email);
      await this.seeResponseCodeIsSuccessful();
      const pendingInvites: any[] = [];
      invitationRsp.data.forEach(invitation => {
        if (invitation.invitationStatus === 'PENDING') {
          pendingInvites.push(invitation);
        } else {
          this.say('Skipping non-pending invite with invite id ' + invitation.id + ', state is ' + invitation.invitationStatus);
        }
      });
      await this.assertEqual(pendingInvites.length, 1);
      return pendingInvites[0];
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
    async haveUser(body: any = null) {
      if (!body) {
        body = { password: faker.internet.password({ prefix: 'T1a' }) };
      } else if (!body.password) {
        body.password = faker.internet.password({ prefix: 'T1a' });
      }
      const testSecret = body.password;
      let rsp;
      try {
        rsp = await this.have('user', body);
      } catch (err) {
        this.say('Failed to create user: ' + err);
      }
      if (!rsp || rsp.path) {
        this.say('RETRY: Failed to create user with status: ' + rsp?.status + ', will try again.');
        rsp = await this.safeHave('user', body);
      }
      rsp.password = testSecret;
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
    async getWithRetry(url: string, headers: any = null) {
      let result;
      try {
        result = await this.sendGetRequest(url, headers);
      } catch (err) {
        console.warn('Failed call to GET ' + url, err);
      }
      if (!result || result.status >= 400) {
        this.say('RETRY: Failed first call to GET ' + url + ' will try again');
        this.wait(1);
        result = await this.sendGetRequest(url, headers);
      }
      return result;
    },
  });
}
