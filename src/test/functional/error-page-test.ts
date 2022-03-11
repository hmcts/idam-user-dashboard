import {config as testConfig} from '../config';
import {randomData} from './shared/random-data';
import {createUserWithRoles} from './shared/apiHelpers';

Feature('Error Pages');

const dashboardUserEMAIL = testConfig.TEST_SUITE_PREFIX + randomData.getRandomEmailAddress();
BeforeSuite(async () => {
  await createUserWithRoles(dashboardUserEMAIL, testConfig.PASSWORD, testConfig.USER_FIRSTNAME, [testConfig.RBAC.access]);
});

Before(async ({I}) => {
  await I.loginAs(dashboardUserEMAIL, testConfig.PASSWORD);
  await I.waitForText('Manage existing users');
});

Scenario('@CrossBrowser I as a system owner should be able to see Status code: 404 error code if page not exists', async ({I}) => {
  await I.amOnPage('/pageNotFound');
  await I.waitForText('Page not found');
  await I.waitForText('Status code: 404');
});

Scenario('@CrossBrowser I as a system owner should be able to see Status code: 403 error code if _csrf value has changed', async ({I}) => {
  await I.fillField('_csrf', 'changedFieldValue');
  await I.click('Continue');
  await I.waitForText('Status code: 403');
});
