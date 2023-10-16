import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {
  assignRolesToParentRole,
  createAssignableRoles, createRoleFromTestingSupport,
  createUserWithRoles
} from './shared/testingSupportApi';
import { User } from '../../main/interfaces/User';

Feature('Remove SSO ID');

const PARENT_ROLE = randomData.getRandomRole();
const ASSIGNABLE_CHILD_ROLE = randomData.getRandomRole();
let dashboardUser: User;

BeforeSuite(async () => {
  await createRoleFromTestingSupport(PARENT_ROLE,[]);
  await createRoleFromTestingSupport(ASSIGNABLE_CHILD_ROLE,[]);
  // Assigning self role with the child role so the this user can also delete same level users
  await createRoleFromTestingSupport(PARENT_ROLE, [ASSIGNABLE_CHILD_ROLE, PARENT_ROLE]);

  dashboardUser = await createUserWithRoles(
    randomData.getRandomEmailAddress(),
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [testConfig.RBAC.access, PARENT_ROLE]
  );
});


Scenario('I as a user should be able to remove sso from user account', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  const { ssoId, ssoProvider } = await I.createUserWithSsoId(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE],
    randomData.getRandomSSOId()
  );

  I.loginAs(dashboardUser.email, testConfig.PASSWORD);
  I.see('Manage an existing user');
  I.gotoUserDetails(userEmail);
  I.see('IdP User ID');
  I.see('Identity Provider');
  I.see(ssoId);
  I.see(ssoProvider);
  I.see('Remove SSO');
  I.click('Remove SSO');
  I.see('Are you sure you want to remove single sign-on for this user? The user will need to reset their password.');
  I.click('#confirmRadio');
  I.click('Continue');
  I.see('Single sign-on removed successfully');
  I.click('Return to user details');
  I.see('User Details');
  I.see(userEmail);
  I.dontSee('IdP User ID');
  I.see('Identity Provider');
  I.see('IDAM');
  I.dontSee(ssoId);
  I.dontSee(ssoProvider);
}).tag('@CrossBrowser');

Scenario('I as a user should be able to select no while removing sso', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  const { ssoId, ssoProvider } = await I.createUserWithSsoId(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [ASSIGNABLE_CHILD_ROLE],
    randomData.getRandomSSOId()
  );

  I.loginAs(dashboardUser.email);
  I.see('Manage an existing user');
  I.gotoUserDetails(userEmail);
  I.see('IdP User ID');
  I.see('Identity Provider');
  I.see(ssoId);
  I.see(ssoProvider);
  I.see('Remove SSO');
  I.click('Remove SSO');
  I.see('Are you sure you want to remove single sign-on for this user? The user will need to reset their password.');
  I.click('#confirmRadio-2');
  I.click('Continue');
  I.see('User Details');
  I.see(userEmail);
  I.see('IdP User ID');
  I.see('Identity Provider');
  I.see(ssoId);
  I.see(ssoProvider);
}).tag('@CrossBrowser');

