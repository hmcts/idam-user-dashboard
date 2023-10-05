import {
  createUserWithRoles, createAssignableRoles, assignRolesToParentRole, createRoles,createServices
} from './shared/testingSupportApi';
import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {BETA_DELETE} from '../../main/app/feature-flags/flags';

Feature('Delete User');

const PARENT_ROLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE = randomData.getRandomRole();
const INDEPENDENT_CHILD_ROLE = randomData.getRandomRole();
const PARENT_ROLE_EMAIL = randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createRoles(PARENT_ROLE,[]);
  await createRoles(ASSIGNABLE_CHILD_ROLE,[]);
  await createRoles(INDEPENDENT_CHILD_ROLE,[]);
  // Assigning self role with the child role so the this user can also delete same level users
  await createRoles(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);
  await createUserWithRoles(PARENT_ROLE_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
});

Scenario('I as a user should not be able delete user if I do not have the role with right to delete',
  {featureFlags: [BETA_DELETE]},
  async ({I}) => {
    const nonDeletableUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      nonDeletableUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [INDEPENDENT_CHILD_ROLE]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(nonDeletableUserEmail);
    I.dontSee('Delete user');
  }
).tag('@apple');

Scenario('I as a user should not be able delete user with both deletable and other non-deletable roles',
  {featureFlags: [BETA_DELETE]},
  async ({I}) => {
    const nonDeletableUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      nonDeletableUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [INDEPENDENT_CHILD_ROLE, ASSIGNABLE_CHILD_ROLE]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(nonDeletableUserEmail);
    I.dontSee('Delete user');
  }
);

Scenario('I as a user should be able delete user successfully if I have the right role',
  {featureFlags: [BETA_DELETE]},
  async ({I}) => {
    const deletableUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      deletableUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [ASSIGNABLE_CHILD_ROLE]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(deletableUserEmail);
    I.click('Delete user');
    I.see('Are you sure you want to delete this user? This action is not reversible.');
    I.click('Yes');
    I.click('Continue');
    I.see('User deleted successfully');
    I.click('Return to main menu');
    I.click('Manage an existing user');
    I.click('Continue');
    I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', deletableUserEmail);
    I.click('Search');
    I.see('No user matches your search for: ' + deletableUserEmail);
  }
).tag('@CrossBrowser');

Scenario('I as a user should be able delete users with same role successfully',
  {featureFlags: [BETA_DELETE]},
  async ({I}) => {
    const deletableUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      deletableUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [PARENT_ROLE]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(deletableUserEmail);
    I.click('Delete user');
    I.see('Are you sure you want to delete this user? This action is not reversible.');
    I.click('Yes');
    I.click('Continue');
    I.see('User deleted successfully');
    I.click('Return to main menu');
    I.click('Manage an existing user');
    I.click('Continue');
    I.see('Please enter the email address, user ID or SSO ID of the user you wish to manage');
    I.click('#search');
    I.fillField('#search', deletableUserEmail);
    I.click('Search');
    I.see('No user matches your search for: ' + deletableUserEmail);
  }
);

Scenario('I as a user should be able to cancel when deleting a user',
  {featureFlags: [BETA_DELETE]},
  async ({I}) => {
    const deletableUserEmail = randomData.getRandomEmailAddress();

    I.createUserWithRoles(
      deletableUserEmail,
      testConfig.PASSWORD,
      testConfig.USER_FIRSTNAME,
      [ASSIGNABLE_CHILD_ROLE]
    );
    I.loginAs(PARENT_ROLE_EMAIL);
    I.see('Manage an existing user');
    I.gotoUserDetails(deletableUserEmail);
    I.click('Delete user');
    I.see('Are you sure you want to delete this user? This action is not reversible.');
    I.click('No');
    I.click('Continue');
    I.see('User Details');
    I.see(deletableUserEmail);
  }
);
