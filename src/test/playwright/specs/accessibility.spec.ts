import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/admin.fixture';
import {
  navigateToEditUser,
  navigateToGenerateReport,
  navigateToManageUser,
  navigateToRegisterUser,
  navigateToSearchUser,
} from '../helpers/navigation';

async function runA11yAudit(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

test.describe('v2_accessibility_tests (Playwright migration)', () => {
  test('I am on manage user page', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await navigateToManageUser(page, testUser.email);
    await runA11yAudit(page);
  });

  test('I am on search user page', async ({ page }) => {
    await navigateToSearchUser(page);
    await runA11yAudit(page);
  });

  test('I am on edit user page', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await navigateToEditUser(page, testUser.id);
    await runA11yAudit(page);
  });

  test('I am on generate user report page', async ({ page }) => {
    await navigateToGenerateReport(page);
    await runA11yAudit(page);
  });

  test('I am on add a new user page', async ({ page }) => {
    await navigateToRegisterUser(page);
    await runA11yAudit(page);
  });
});
