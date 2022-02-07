Feature('Error Pages');

Before(async ({I}) => {
  I.loginAsSystemOwner();
  I.waitForText('Manage existing users');
});

Scenario('I as a system owner should be able to see Status code: 404 error code if page not exists', ({I}) => {
  I.amOnPage('/pageNotFound');
  I.waitForText('Page not found');
  I.waitForText('Status code: 404');
});

Scenario('I as a system owner should be able to see Status code: 403 error code if _csrf value has changed', ({I}) => {
  I.fillField('_csrf', 'changedFieldValue');
  I.click('Continue');
  I.waitForText('Status code: 403');
});
