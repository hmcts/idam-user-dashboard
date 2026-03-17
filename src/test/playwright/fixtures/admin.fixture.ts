import { expect } from '@playwright/test';
import { test as base } from './base.fixture';
import { getAdminEmailForProject, getStorageStatePath } from '../helpers/auth-state';

type AdminFixtures = {
  adminSession: void;
};

export const test = base.extend<AdminFixtures>({
  storageState: async ({ baseURL }, use, testInfo) => {
    void baseURL;
    await use(getStorageStatePath(testInfo.project.name));
  },
  adminSession: [async ({ page, setupDao }, use, testInfo) => {
    if (!process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET) {
      throw new Error('FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET is required');
    }
    const adminEmail = getAdminEmailForProject(testInfo.project.name);
    await setupDao.setupAdmin(adminEmail);
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('What do you want to do?');
    await use();
  }, { auto: true }],
});

export { expect } from './base.fixture';
