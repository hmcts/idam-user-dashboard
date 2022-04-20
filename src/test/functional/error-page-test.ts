import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/testingSupportApi';

Feature('Error Pages');

const dashboardUserEMAIL = randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Before(async ({I}) => {
  I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  I.waitForText('Manage an existing user');
});

Scenario('I as a system owner should be able to see Status code: 404 error code if page not exists', async ({I}) => {
  I.amOnPage('/pageNotFound');
  I.waitForText('Page not found');
  I.waitForText('Status code: 404');
}).tag('@CrossBrowser');

Scenario('I as a system owner should be able to see Status code: 403 error code if _csrf value has changed', async ({I}) => {
  I.fillField('_csrf', 'changedFieldValue');
  I.click('Continue');
  I.waitForText('Status code: 403');
}).tag('@CrossBrowser');
