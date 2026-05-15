import AxeBuilder from '@axe-core/playwright';
import { Page, TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { test, expect } from '../playwright/fixtures/admin.fixture';
import {
  navigateToEditUser,
  navigateToGenerateReport,
  navigateToManageUser,
  navigateToRegisterUser,
  navigateToSearchUser,
} from '../playwright/helpers/navigation';

const AXE_RESULTS_DIR = path.resolve(process.cwd(), 'functional-output/accessibility/axe-results');

function toFileName(testInfo: TestInfo): string {
  return testInfo.titlePath
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function runA11yAudit(page: Page, testInfo: TestInfo): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();

  await mkdir(AXE_RESULTS_DIR, { recursive: true });
  await writeFile(
    path.join(AXE_RESULTS_DIR, `${toFileName(testInfo)}.json`),
    JSON.stringify(
      {
        testName: testInfo.title,
        location: page.url(),
        results,
      },
      null,
      2
    )
  );

  expect(results.violations).toEqual([]);
}

test.describe('accessibility_tests', () => {
  test('I am on manage user page', async ({ page, setupDao }, testInfo) => {
    const testUser = await setupDao.createUser();
    await navigateToManageUser(page, testUser.email);
    await runA11yAudit(page, testInfo);
  });

  test('I am on search user page', async ({ page }, testInfo) => {
    await navigateToSearchUser(page);
    await runA11yAudit(page, testInfo);
  });

  test('I am on edit user page', async ({ page, setupDao }, testInfo) => {
    const testUser = await setupDao.createUser();
    await navigateToEditUser(page, testUser.id);
    await runA11yAudit(page, testInfo);
  });

  test('I am on generate user report page', async ({ page }, testInfo) => {
    await navigateToGenerateReport(page);
    await runA11yAudit(page, testInfo);
  });

  test('I am on add a new user page', async ({ page }, testInfo) => {
    await navigateToRegisterUser(page);
    await runA11yAudit(page, testInfo);
  });
});
