import { faker } from '@faker-js/faker';

Feature('v2_error_page');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('view error page',  ({ I }) => {
  I.amOnPage('/noSuchPage');
  I.see('Page not found');
  I.see('Status code: 404');
});