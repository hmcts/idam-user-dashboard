import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';

Feature('User Sign In');

Scenario('I as a user with access role can sign in', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  I.createUserWithRoles(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [testConfig.RBAC.access]
  );
  I.tryLoginAs(userEmail);
  I.dontSee('Sorry, access to this resource is forbidden');
  I.dontSee('Status code: 403');
  I.seeCookie('idam-user-dashboard-session');
}).tag('@CrossBrowser');

Scenario('I as a user without access role cannot access service and is shown error page', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  I.createUserWithRoles(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [testConfig.USER_ROLE_CITIZEN]
  );
  I.tryLoginAs(userEmail);
  I.see('Sorry, access to this resource is forbidden');
  I.see('Status code: 403');
  I.dontSeeCookie('idam-user-dashboard-session');
});

Scenario('I as a user with citizen role cannot access service and is shown error page', async ({I}) => {
  const userEmail = randomData.getRandomEmailAddress();

  I.createUserWithRoles(
    userEmail,
    testConfig.PASSWORD,
    testConfig.USER_FIRSTNAME,
    [testConfig.USER_ROLE_CITIZEN]
  );
  I.tryLoginAs(userEmail);
  I.see('Sorry, access to this resource is forbidden');
  I.see('Status code: 403');
  I.dontSeeCookie('idam-user-dashboard-session');
});


