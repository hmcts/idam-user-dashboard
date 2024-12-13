import { faker } from '@faker-js/faker';

Feature('v2_view_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('view admin user details', async ({ I }) => {
  const adminEmail = codeceptjs.container.support('adminIdentity').email;
  await I.navigateToManageUser(adminEmail);
  I.see(adminEmail, I.locateDataForTitle('Email'));
});

Scenario('view test user details',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('IDAM', I.locateDataForTitle('Identity Provider'));
  I.dontSeeElement(I.locateTitle('IdP User ID'));
  await I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
});

Scenario('view test user with sso details',  async ({ I }) => {
  const testUser = await I.haveUser({
    ssoId: faker.string.uuid(),
    ssoProvider: 'idam-sso'
  });
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('idam-sso', I.locateDataForTitle('Identity Provider'));
  I.see(testUser.ssoId, I.locateDataForTitle('IdP User ID'));
  await I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
});

Scenario('view test user with ejudiciary provider details',  async ({ I }) => {
  const testUser = await I.haveUser({
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('eJudiciary.net', I.locateDataForTitle('Identity Provider'));
  I.see(testUser.ssoId, I.locateDataForTitle('eJudiciary User ID'));
  await I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
  I.see('Please check with the eJudiciary support team to see if there are related accounts.', locate('div.govuk-notification-banner'));
});

Scenario('view suspended user details',  async ({ I }) => {
  const testUser = await I.haveUser({accountStatus: 'SUSPENDED'});
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('IDAM', I.locateDataForTitle('Identity Provider'));
  I.dontSeeElement(I.locateTitle('IdP User ID'));
  await I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
});

Scenario('view locked user details',  async ({ I }) => {
  const testUser = await I.haveUser();
  I.lockTestUser(testUser.email);
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('IDAM', I.locateDataForTitle('Identity Provider'));
  I.dontSeeElement(I.locateTitle('IdP User ID'));
  await I.seeIgnoreCase('locked', I.locateStrongDataForTitle('Account state'));
  I.see('This account has been temporarily locked', locate('div.govuk-warning-text'));
});

Scenario('view archived user details',  async ({ I }) => {
  const testUser = await I.haveUser({recordType: 'ARCHIVED'});
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('IDAM', I.locateDataForTitle('Identity Provider'));
  I.dontSeeElement(I.locateTitle('IdP User ID'));
  await I.seeIgnoreCase('archived', I.locateStrongDataForTitle('Account state'));
  I.see('Archived accounts are read only.', locate('div.govuk-notification-banner'));
});