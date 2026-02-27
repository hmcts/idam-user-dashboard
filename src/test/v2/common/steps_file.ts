// in this file you can append custom step methods to 'I' object
const { faker } = require('@faker-js/faker');
const envConfig = require('config');
const { tryTo, retryTo } = require('codeceptjs/effects');

const CLICK_RETRY = { retries: 3, minTimeout: 500, maxTimeout: 5000 };
const AFTER_CLICK_RETRY = { retries: 9, minTimeout: 300 };
const IDAM_API_URL = String(envConfig.get('services.idam.url.api') || '');
if (!/^https?:\/\//.test(IDAM_API_URL)) {
  throw new Error(`Invalid services.idam.url.api URL: "${envConfig.get('services.idam.url.api')}"`);
}

export = function() {
  return actor({
    async withRetry(action, retryConfig = AFTER_CLICK_RETRY) {
      const retries = typeof retryConfig === 'number' ? retryConfig : retryConfig.retries;
      const minTimeout = typeof retryConfig === 'number' ? 200 : retryConfig.minTimeout;
      await retryTo(async () => action(), retries, minTimeout || 200);
    },
    async doLogin(email : string, password : string) {
      await this.amOnPage('/');
      await this.waitForElement('h1', 10);
      const heading = (await this.grabTextFrom('h1')).trim();
      if (heading === 'Sign in') {
        return this.doClassicLogin(email, password);
      }
      if (heading === 'Enter your email address' || heading === 'Enter your password' || heading === 'What do you want to do?') {
        return this.doModernLogin(email, password);
      }
      throw new Error(`Unexpected login page heading: "${heading}"`);
    },
    async doClassicLogin(email : string, password : string) {
      await this.say('Classic login');
      await this.withRetry(() => this.see('Sign in', 'h1'));
      await this.fillField('Email', email);
      await this.fillField('Password', secret(password));
      await this.withRetry(() => this.click('Sign in'), CLICK_RETRY);
      await this.withRetry(() => this.dontSee('Sign in', 'h1'));
      await this.withRetry(() => this.seeElement('h1'));
      await this.withRetry(() => this.see('What do you want to do?', 'h1'));
    },
    async doModernLogin(email : string, password : string) {
      await this.say('Modern login');
      await this.waitForElement('h1', 10);
      const startHeading = (await this.grabTextFrom('h1')).trim();
      if (startHeading === 'What do you want to do?') {
        return;
      }
      if (startHeading === 'Sign in') {
        await this.doClassicLogin(email, password);
        return;
      }
      if (startHeading === 'Enter your email address') {
        await this.fillField('email', email);
        await this.withRetry(() => this.click('Continue'), CLICK_RETRY);
      } else if (startHeading !== 'Enter your password') {
        throw new Error(`Unexpected modern login heading: "${startHeading}"`);
      }
      await this.withRetry(() => this.see('Enter your password', 'h1'));
      await this.fillField('password', secret(password));
      await this.withRetry(() => this.click('Continue'), CLICK_RETRY);
      await this.withRetry(() => this.seeElement('h1'));
      await this.withRetry(() => this.see('What do you want to do?', 'h1'));
    },
    async loginAs(email : string, password : string) {
      await this.doLogin(email, password);
      const atHome = await tryTo(() => this.see('What do you want to do?', 'h1'));
      if (!atHome) {
        await this.doLogin(email, password);
      }
      await this.withRetry(() => this.see('What do you want to do?', 'h1'));
    },
    async goToPage(expectedUrl: String, expectedHeading? : String) {
      await tryTo(() => this.amOnPage(expectedUrl));
      const foundHeading = await tryTo(() => this.waitForElement('h1', 3));
      let currentHeading;
      if (foundHeading) {
        currentHeading = await this.grabTextFrom('h1');
      }
      if (!currentHeading || currentHeading.trim() != expectedHeading) {
        this.say('failed to reach expected page on first attempt');
        this.amOnPage(expectedUrl);
        await this.withRetry(() => this.seeElement('h1'));
        await this.withRetry(() => this.see(expectedHeading, 'h1'));
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
      await this.withRetry(() => this.fillField('search', searchValue));
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
      this.withRetry(() => this.see(seeValue, location));
    },
    async clickToNavigateWithNoRetry(clickText : String, expectedUrl : String, expectedHeading? : String) {
      const originalHeading : String = await this.grabTextFrom('h1');
      await this.withRetry(() => this.click(clickText), CLICK_RETRY);
      await this.withRetry(() => this.dontSee(originalHeading.trim(), 'h1'));
      await this.withRetry(() => this.seeInCurrentUrl(expectedUrl));
      await this.withRetry(() => this.seeElement('h1'));
      if (expectedHeading) {
        await this.withRetry(() => this.see(expectedHeading, 'h1'));
      }
    },
    async clickToNavigate(clickText : String, expectedUrl : String, expectedHeading? : String) {
      const originalHeading : String = await this.grabTextFrom('h1');
      await this.withRetry(() => this.click(clickText), CLICK_RETRY);
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
          await this.withRetry(() => this.click(clickText), CLICK_RETRY);
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
      await this.withRetry(() => this.dontSee(originalHeading.trim(), 'h1'));
      await this.withRetry(() => this.seeInCurrentUrl(expectedUrl));
      await this.withRetry(() => this.seeElement('h1'));
      if (expectedHeading) {
        await this.withRetry(() => this.see(expectedHeading, 'h1'));
      }
    },
    async clickToExpectProblem(clickText : String) {
      await this.withRetry(() => this.click(clickText), CLICK_RETRY);
      await tryTo(() => {
        this.see('Bad Gateway');
        this.say('Oh no, there is a bad gateway. Let me try again');
        this.wait(1);
        this.refreshPage();
      });
      await this.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    },
    async clickToExpectSuccess(clickText : String) {
      await this.withRetry(() => this.click(clickText), CLICK_RETRY);
      await tryTo(() => {
        this.see('Bad Gateway');
        this.say('Oh no, there is a bad gateway. Let me try again');
        this.wait(1);
        this.refreshPage();
      });
      await this.seeAfterClick('Success', locate('h2.govuk-notification-banner__title'));
    },
    async lockTestUser(email : string) {
      for (let i=0; i<5; i++) {
        const clientSecret = process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET;
        if (!clientSecret) {
          throw new Error('FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET is not set');
        }
        const form = new URLSearchParams({
          grant_type: 'password',
          client_id: 'idam-functional-test-service',
          client_secret: clientSecret,
          scope: 'profile roles',
          username: email,
          password: 'invalid'
        }).toString();
        await this.sendPostRequest(`${IDAM_API_URL}/o/token`, form, {
          'Content-Type': 'application/x-www-form-urlencoded'
        });
        await this.wait(1);
      }
    },
    async archiveExistingTestUser(user: any, testToken: string) {
      user.recordType = 'ARCHIVED';
      const activateRequest = {
        password: 'redundant',
        user
      };
      this.amBearerAuthenticated(testToken);
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
