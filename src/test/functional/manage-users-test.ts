import {config} from '../config';

Feature('User Sign In');

const SUPER_USER_EMAIL = 'superusermanage@test.com';
const ADMIN_USER_EMAIL = 'adminusermanage@test.com';

BeforeSuite(async ({I}) => {
  await I.createUserWithRoles(SUPER_USER_EMAIL, config.SUPER_USER_FIRSTNAME, [config.SUPER_USER_ROLE]);
  await I.createUserWithRoles(ADMIN_USER_EMAIL, config.ADMIN_USER_FIRSTNAME, [config.ADMIN_USER_ROLE]);
});

AfterSuite(async ({I}) => {
  await I.deleteUser(SUPER_USER_EMAIL);
  await I.deleteUser(ADMIN_USER_EMAIL);
});

Scenario('I as a system owner should be able to manage the users', ({I}) => {
  I.loginAsSystemOwner();
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as a super user should be able to manage the users', ({I}) => {
  I.loginAsSuperUser(SUPER_USER_EMAIL);
}).retry(config.SCENARIO_RETRY_LIMIT);

Scenario('I as an admin user should be able to manage the users', ({I}) => {
  I.loginAsAdminUser(ADMIN_USER_EMAIL);
}).retry(config.SCENARIO_RETRY_LIMIT);

After(async ({I}) => {
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
});
