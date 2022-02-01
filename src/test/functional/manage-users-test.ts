Feature('Manage Users');

Scenario('I as a system owner should be able to manage the users', ({I}) => {
  I.loginAsSystemOwner();
});

Scenario('I as a super user should be able to manage the users', ({I}) => {
  I.loginAsSuperUser();
});

Scenario('I as an admin user should be able to manage the users', ({I}) => {
  I.loginAsAdminUser();
});

After(async ({I}) => {
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
});
