import { faker } from '@faker-js/faker';

Feature('v2_edit_user_remove_sso');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin can remove SSO successfully',  async ({ I, setupDAO }) => {
  const testUser = await I.have('user', {
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });

  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('eJudiciary.net', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.see(testUser.ssoId, locate('dd').after(locate('dt').withText('eJudiciary User ID')));

  I.see('Remove SSO');
  I.click('Remove SSO');
  I.seeAfterClick('Are you sure you want to remove single sign-on', 'h1');
  I.checkOption('#confirmRadio');
  I.click('Continue');
  I.seeAfterClick('Single sign-on removed successfully', 'h1');

  I.click('Return to user details');
  I.seeAfterClick('User Details', 'h1');
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('IDAM', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.dontSeeElement(locate('dt').withText('IdP User ID'));
});

Scenario('I as an admin can cancel removing SSO',  async ({ I, setupDAO }) => {
  const testUser = await I.have('user', {
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });

  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('eJudiciary.net', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.see(testUser.ssoId, locate('dd').after(locate('dt').withText('eJudiciary User ID')));

  I.see('Remove SSO');
  I.click('Remove SSO');
  I.seeAfterClick('Are you sure you want to remove single sign-on', 'h1');
  I.checkOption('#confirmRadio-2');
  I.click('Continue');
  I.seeAfterClick('User Details', 'h1');
  I.see(testUser.email, locate('dd').after(locate('dt').withText('Email')));
  I.see('eJudiciary.net', locate('dd').after(locate('dt').withText('Identity Provider')));
  I.see(testUser.ssoId, locate('dd').after(locate('dt').withText('eJudiciary User ID')));

});