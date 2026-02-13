Feature('v2_sign_in');

Before(async ({ setupDAO }) => {

  await setupDAO.setupAdmin();

});

Scenario('login as admin successfully',  ({ I, login }) => {
  login('admin');
  I.seeAfterClick('What do you want to do?', 'h1');
  I.dontSee('Sorry, access to this resource is forbidden');
  I.dontSee('Status code: 403');
  I.dontSee('Status code: 400');
  I.seeCookie('idam_user_dashboard_session');
});

Scenario('login as user without access', async ({ I }) => {
  const testUser = await I.haveUser();
  I.amOnPage('/');
  const currentHeading = await I.grabTextFrom('h1');
  if (currentHeading == 'Sign in') {
    I.fillField('Email', testUser.email);
    I.fillField('Password', secret(testUser.password));
    I.click('Sign in');  
  } else {
    I.fillField('email', testUser.email);
    I.click('Continue');  
    I.fillField('password', secret(testUser.password));
    I.click('Continue');  
  }
  I.seeAfterClick('Sorry, access to this resource is forbidden', 'h1');
  I.see('Status code: 403');
  I.seeCookie('idam_user_dashboard_session');
});

Scenario('return back from service on the callback url', async ({ I }) => {
  I.amOnPage('/callback');
  I.dontSeeInCurrentUrl('/callback');
  const currentHeading = await I.grabTextFrom('h1');
  I.see(currentHeading, 'h1');
});
