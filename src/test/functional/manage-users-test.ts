import {config} from '../config';

Feature('User Sign In');

BeforeSuite(async ({I}) => {
  await I.createUserWithRoles(config.SUPER_USER_EMAIL, config.SUPER_USER_FIRSTNAME, [config.SUPER_USER_ROLE]);
  await I.createUserWithRoles(config.ADMIN_USER_EMAIL, config.ADMIN_USER_FIRSTNAME, [config.ADMIN_USER_ROLE]);
});

AfterSuite(async ({I}) => {
  await I.deleteUser(config.SUPER_USER_EMAIL);
  await I.deleteUser(config.ADMIN_USER_EMAIL);
});

Scenario('I as an system owner should be able to manage the users', ({I}) => {
  I.loginAsSystemOwner();
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an super user should be able to manage the users', ({I}) => {
  I.loginAsSuperUser();
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an admin user should be able to manage the users', ({I}) => {
  I.loginAsAdminUser();
}).retry(config.SCENARIO_RETRY_LIMIT);

After(async ({I}) => {
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
});
