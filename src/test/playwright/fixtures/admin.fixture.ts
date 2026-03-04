import { expect } from '@playwright/test';
import { test as base } from './base.fixture';
import { loginAs } from '../helpers/ui-auth';

type AdminFixtures = {
  adminSession: void;
};

export const test = base.extend<AdminFixtures>({
  adminSession: [async ({ page, setupDao }, use, testInfo) => {
    if (!process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET) {
      testInfo.skip('FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET is required');
      return;
    }
    await setupDao.setupAdmin();
    const adminIdentity = setupDao.getAdminIdentity();
    await loginAs(page, adminIdentity.email, adminIdentity.secret);
    await expect(page.locator('h1')).toHaveText('What do you want to do?');
    await use();
  }, { auto: true }],
});

export { expect } from './base.fixture';
