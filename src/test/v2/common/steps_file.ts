// in this file you can append custom step methods to 'I' object
import { injectAxe, checkA11y } from 'axe-playwright';

const AFTER_CLICK_RETRY = { retries: 9, minTimeout: 250 };

export = function() {
  return actor({
    loginAs(email : string, password : string) {
      this.amOnPage('/');
      this.retry(AFTER_CLICK_RETRY).see('Sign in', 'h1');
      this.fillField('Email', email);
      this.fillField('Password', secret(password));
      this.clickToNavigate('Sign in', '/', 'What do you want to do?');
    },
    async navigateToManageUser(searchValue : string) {
      await this.navigateToSearchUser();
      this.fillField('search', searchValue);
      await this.clickToNavigate('Search', '/details', 'User Details');
    },
    async navigateToSearchUser() {
      this.amOnPage('/');
      this.checkOption('Manage an existing user');
      await this.clickToNavigate('Continue', '/user/manage', 'Search for an existing user');
    },
    async navigateToEditUser(searchValue : string) {
      await this.navigateToManageUser(searchValue);
      await this.clickToNavigate('Edit user', '/user/edit', 'Edit User');
    },
    async navigateToGenerateReport() {
      this.amOnPage('/');
      this.checkOption('Generate a user report');
      await this.clickToNavigate('Continue', '/reports', 'Generate report');
    },
    async navigateToRegisterUser() {
      this.amOnPage('/');
      this.checkOption('Add a new user');
      await this.clickToNavigate('Continue', '/user/add', 'Add new user email');
    },
    seeAfterClick(seeValue : string, location) {
      this.retry(AFTER_CLICK_RETRY).see(seeValue, location);
    },
    async clickToNavigate(clickText : String, expectedUrl : String, expectedHeading? : String) {
      const originalHeading : String = await this.grabTextFrom('h1');
      this.retry(AFTER_CLICK_RETRY).click(clickText);
      this.retry(AFTER_CLICK_RETRY).dontSee(originalHeading.trim(), 'h1');
      this.retry(AFTER_CLICK_RETRY).seeInCurrentUrl(expectedUrl);
      this.retry(AFTER_CLICK_RETRY).seeElement('h1');
      if (expectedHeading) {
        this.retry(AFTER_CLICK_RETRY).see(expectedHeading, 'h1');
      }
    },
    async clickToExpectProblem(clickText : String) {
      this.retry(AFTER_CLICK_RETRY).click(clickText);
      this.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    },
    async clickToExpectSuccess(clickText : String) {
      this.retry(AFTER_CLICK_RETRY).click(clickText);
      this.seeAfterClick('Success', locate('h2.govuk-notification-banner__title'));
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
    },
    async haveUser(body = null) {
      return this.safeHave('user', body);
    },
    async haveRole(body = null) {
      return this.safeHave('role', body);
    },
    async haveService(body = null) {
      return this.safeHave('service', body);
    },
    async safeHave(type, body = null) {
      const rsp = await this.have(type, body);
      // error responses will always have a path attribute
      if (rsp.path) {
        console.log('error creating %s: %j', type, rsp);
        this.assertEqual(rsp.status, 201);
      }
      return rsp;
    },
    checkA11y(fileName: string) {
      this.runA11yCheck({ reportFileName: fileName });
      this.usePlaywrightTo('Run accessibility tests', async ({ page }) => {
        await injectAxe(page);
        await checkA11y(page);
      });
    },
  });
}
