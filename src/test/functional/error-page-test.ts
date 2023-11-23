import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/testingSupportApi';

Feature('Error Pages');

const dashboardUserEMAIL = randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Scenario('I as a system owner should be able to see Status code: 404 error code if page not exists', async ({I}) => {
  I.retry(3).loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.see('Manage an existing user');
  I.amOnPage('/pageNotFound');
  I.see('Page not found');
  I.see('Status code: 404');
}).tag('@CrossBrowser');
