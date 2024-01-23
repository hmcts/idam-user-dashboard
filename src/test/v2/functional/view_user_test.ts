const { faker } = require('@faker-js/faker');

Feature('v2_view_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('view admin user details',  ({ I }) => {
  const adminEmail = codeceptjs.container.support('adminIdentity').email;
  I.navigateToManageUser(adminEmail);
  I.see(adminEmail, locate('dd').after(locate('dt').withText('Email')));
});

Scenario('view test user details',  async ({ I }) => {
  const testUser = await I.have('user');
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('IDAM', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.dontSeeElement(locate('dt').withText('IdP User ID'));
  const accountStatus = await I.grabTextFrom(locate('strong').inside(locate('dd').after(locate('dt').withText('Account state'))));
  I.assertEqualIgnoreCase(accountStatus, 'active');
});

Scenario('view test user with sso details',  async ({ I }) => {
  const testUser = await I.have('user', {
    ssoId: faker.string.uuid(),
    ssoProvider: 'idam-sso'
  });
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('idam-sso', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.see(testUser.ssoId, locate('dd').after(locate('dt').withText('IdP User ID')));
  const accountStatus = await I.grabTextFrom(locate('strong').inside(locate('dd').after(locate('dt').withText('Account state'))));
  I.assertEqualIgnoreCase(accountStatus, 'active');
});

Scenario('view test user with ejudiciary provider details',  async ({ I }) => {
  const testUser = await I.have('user', {
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('eJudiciary.net', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.see(testUser.ssoId, locate('dd').after(locate('dt').withText('eJudiciary User ID')));
  const accountStatus = await I.grabTextFrom(locate('strong').inside(locate('dd').after(locate('dt').withText('Account state'))));
  I.assertEqualIgnoreCase(accountStatus, 'active');
  I.see('Please check with the eJudiciary support team to see if there are related accounts.', locate('div.govuk-notification-banner'));
});

Scenario('view suspended user details',  async ({ I }) => {
  const testUser = await I.have('user', {accountStatus: 'SUSPENDED'});
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('IDAM', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.dontSeeElement(locate('dt').withText('IdP User ID'));
  const accountStatus = await I.grabTextFrom(locate('strong').inside(locate('dd').after(locate('dt').withText('Account state'))));
  I.assertEqualIgnoreCase(accountStatus, 'suspended');
});

Scenario('view locked user details',  async ({ I }) => {
  const testUser = await I.have('user');
  I.lockTestUser(testUser.email);
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('IDAM', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.dontSeeElement(locate('dt').withText('IdP User ID'));
  const accountStatus = await I.grabTextFrom(locate('strong').inside(locate('dd').after(locate('dt').withText('Account state'))));
  I.assertEqualIgnoreCase(accountStatus, 'active');
  I.see('This account has been temporarily locked', locate('div.govuk-warning-text'));
});

Scenario('view archived user details',  async ({ I }) => {
  const testUser = await I.have('user', {recordType: 'ARCHIVED'});
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('IDAM', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.dontSeeElement(locate('dt').withText('IdP User ID'));
  const accountStatus = await I.grabTextFrom(locate('strong').inside(locate('dd').after(locate('dt').withText('Account state'))));
  I.assertEqualIgnoreCase(accountStatus, 'archived');
  I.see('Archived accounts are read only.', locate('div.govuk-notification-banner'));
});