Feature('v2_error_page');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  await login('admin');

});

Scenario('view error page',  ({ I }) => {
  I.amOnPage('/noSuchPage');
  I.see('Page not found');
  I.see('Status code: 404');
});