import {
  assignRolesToParentRole,
  createAssignableRoles,
  createUserWithRoles
} from './shared/testingSupportApi';
import '../../main/utils/utils';
import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import { convertISODateTimeToUTCFormat } from '../../main/utils/utils';

Feature('Manage Existing User');

const PARENT_ROLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE = randomData.getRandomRole();
const DASHBOARD_USER_EMAIL = randomData.getRandomEmailAddress();

BeforeSuite(async () => {
  await createAssignableRoles(PARENT_ROLE);
  await createAssignableRoles(ASSIGNABLE_CHILD_ROLE);
  // Assigning self role with the child role so the this user can also delete same level users
  await assignRolesToParentRole(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);
  await createUserWithRoles(DASHBOARD_USER_EMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access, PARENT_ROLE]);
});

Scenario('I as a user should be able to see the details of a user', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  const { id, forename, surname, createDate, lastModified } = await I.createUserWithRoles(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE]
  );
  I.loginAs(DASHBOARD_USER_EMAIL);
  I.gotoUserDetails(userEmail);
  I.see(id);
  I.see(userEmail);
  I.see(forename);
  I.see(surname);
  I.see(ASSIGNABLE_CHILD_ROLE);
  I.see(convertISODateTimeToUTCFormat(createDate));
  I.see(convertISODateTimeToUTCFormat(lastModified));
}).tag('@CrossBrowser');

Scenario('I as a user should be able to see the SSO details of a user', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  const { ssoId } = await I.createUserWithSsoProvider(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE],
    'azure'
  );
  I.loginAs(DASHBOARD_USER_EMAIL);
  I.gotoUserDetails(userEmail);
  I.see(ssoId);
  I.see('eJudiciary.net');
}).tag('@CrossBrowser');

Scenario('I as a user should be able to see the active status of a user', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  I.createUserWithSsoId(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE],
    randomData.getRandomSSOId()
  );
  I.loginAs(DASHBOARD_USER_EMAIL);
  I.gotoUserDetails(userEmail);
  I.see('ACTIVE');
}).tag('@CrossBrowser');

Scenario('I as a user should be able to see the eJudiciary info message.', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  I.createUserWithSsoProvider(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE],
    'azure'
  );
  I.loginAs(DASHBOARD_USER_EMAIL);
  I.gotoUserDetails(userEmail);
  I.see('Please check with the eJudiciary support team to see if there are related accounts.');
}).tag('@CrossBrowser');

Scenario('I as a user should be able to see the suspended status of a user', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  const { id } = await I.createUserWithRoles(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE]
  );
  I.suspendUser(id);
  I.loginAs(DASHBOARD_USER_EMAIL);
  I.gotoUserDetails(userEmail);
  I.see('SUSPENDED');
});

Scenario('I as a user should be able to see the stale status of a user', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  const { id } = await I.createUserWithRoles(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE]
  );
  I.retireStaleUser(id);
  I.loginAs(DASHBOARD_USER_EMAIL);
  I.gotoUserDetails(userEmail);
  I.see('ARCHIVED');
  I.see('Archived accounts are read only.');
  I.dontSee('Edit user');
  I.dontSee('Delete user');
  I.dontSee('Suspend user');
  I.deleteStaleUser(id);
});
