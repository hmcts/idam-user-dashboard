import { faker } from '@faker-js/faker';

Feature('v2_sign_in');

Before(async ({ setupDAO }) => {

  await setupDAO.setupAdmin();

});

Scenario('login as admin successfully',  ({ I, login }) => {
  login('admin');
  I.dontSee('Sorry, access to this resource is forbidden');
  I.dontSee('Status code: 403');
  I.dontSee('Status code: 400');
  I.seeCookie('idam_user_dashboard_session');
});

Scenario('login as user without access', async ({ I }) => {
  const testSecret = faker.internet.password();
  const testUser = await I.have('user', {password: testSecret});
  I.amOnPage('/');
  I.fillField('Email', testUser.email);
  I.fillField('Password', secret(testSecret));
  I.click('Sign in');  
  I.see('Sorry, access to this resource is forbidden');
  I.see('Status code: 403');
  I.dontSeeCookie('idam_user_dashboard_session');
});
