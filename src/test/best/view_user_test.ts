const { faker } = require('@faker-js/faker');

Feature('view_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('view admin user details',  ({ I }) => {
  const adminEmail = codeceptjs.container.support('adminIdentity').email;
  I.navigateToManageUser(adminEmail);
  I.see('User Details', 'h1');
  I.see(adminEmail, locate('dd').after(locate('dt').withText('Email')));
});

Scenario('view test user details',  async ({ I }) => {
  const testUser = await I.have('user');
  I.navigateToManageUser(testUser.email);
  I.see('User Details', 'h1');
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('Active', locate('strong').inside(locate('dd').after(locate('dt').withText('Account state'))));
  I.see('IDAM', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.dontSeeElement(locate('dt').withText('IdP User ID'));
});

Scenario('view test user with sso details',  async ({ I }) => {
  const testUser = await I.have('user', {
    ssoId: faker.string.uuid(),
    ssoProvider: 'idam-sso'
  });
  I.navigateToManageUser(testUser.email);
  I.see('User Details', 'h1');
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('Active', locate('strong').inside(locate('dd').after(locate('dt').withText('Account state'))));
  I.see('idam-sso', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.see(testUser.ssoId, locate('dd').after(locate('dt').withText('IdP User ID')));
});