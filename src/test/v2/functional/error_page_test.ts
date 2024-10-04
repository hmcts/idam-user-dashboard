Feature('v2_error_page');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('view error page',  ({ I }) => {
  I.amOnPage('/noSuchPage');
  await I.see('Page not found');
  await I.see('Status code: 404');
});