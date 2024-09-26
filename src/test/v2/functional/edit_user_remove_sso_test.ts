import { faker } from '@faker-js/faker';

Feature('v2_edit_user_remove_sso');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin can remove SSO successfully',  async ({ I }) => {
  const testUser = await I.haveUser({
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });

  await I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('eJudiciary.net', I.locateDataForTitle('Identity Provider'));
  I.see(testUser.ssoId, I.locateDataForTitle('eJudiciary User ID'));

  I.see('Remove SSO');
  await I.click('Remove SSO');
  I.seeAfterClick('Are you sure you want to remove single sign-on', 'h1');
  await I.checkOption('#confirmRadio');
  await I.clickToNavigate('Continue', '/user/sso', 'Single sign-on removed successfully');

  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('IDAM', I.locateDataForTitle('Identity Provider'));
  I.dontSeeElement(I.locateTitle('IdP User ID'));
});

Scenario('I as an admin can cancel removing SSO',  async ({ I }) => {
  const testUser = await I.haveUser({
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });

  await I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('eJudiciary.net', I.locateDataForTitle('Identity Provider'));
  I.see(testUser.ssoId, I.locateDataForTitle('eJudiciary User ID'));

  I.see('Remove SSO');
  await I.click('Remove SSO');
  I.seeAfterClick('Are you sure you want to remove single sign-on', 'h1');
  await I.checkOption('#confirmRadio-2');
  await I.clickToNavigate('Continue', '/details', 'User Details');
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.see('eJudiciary.net', I.locateDataForTitle('Identity Provider'));
  I.see(testUser.ssoId, I.locateDataForTitle('eJudiciary User ID'));

});