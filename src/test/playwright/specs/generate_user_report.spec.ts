import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/admin.fixture';
import { navigateToGenerateReport } from '../helpers/navigation';

test.describe('v2_generate_report (Playwright migration)', () => {
  test('I as an admin can see errors for invalid report values', async ({ page, setupDao }) => {
    const testRoleName = `iud-role-${faker.word.verb()}-${faker.word.noun()}`;
    await setupDao.createRole({ name: testRoleName });

    await navigateToGenerateReport(page);
    await page.locator('#search').fill('citizen');
    await page.getByRole('button', { name: 'Generate report' }).click();
    await expect(page.locator('#search-error')).toContainText('For security reasons, it is not possible to get a report on all citizen users');

    await navigateToGenerateReport(page);
    await page.locator('#search').fill(' ');
    await page.getByRole('button', { name: 'Generate report' }).click();
    await expect(page.locator('#search-error')).toContainText('You must enter a role or a list of roles (comma seperated)');

    await navigateToGenerateReport(page);
    await page.locator('#search').fill('idam-never-exists');
    await page.getByRole('button', { name: 'Generate report' }).click();
    await expect(page.locator('body')).toContainText('There are no users with the entered role(s).');

    await navigateToGenerateReport(page);
    await page.locator('#search').fill(testRoleName);
    await page.getByRole('button', { name: 'Generate report' }).click();
    await expect(page.locator('body')).toContainText('There are no users with the entered role(s).');
  });

  test('I as an admin can generate a report', async ({ page, setupDao }) => {
    const testRoleName = `iud-role-${faker.word.verb()}-${faker.word.noun()}`;
    await setupDao.createRole({ name: testRoleName });
    const activeUser = await setupDao.createUser({ roleNames: [testRoleName] });
    const archivedUser = await setupDao.createUser({ roleNames: [testRoleName], recordType: 'ARCHIVED' });

    await navigateToGenerateReport(page);
    await page.locator('#search').fill(testRoleName);
    await page.getByRole('button', { name: 'Generate report' }).click();
    await expect(page.locator('h1')).toHaveText('Generated Report');

    await expect(page.getByRole('button', { name: 'Download report (CSV)' })).toBeVisible();
    await expect(page.locator('table')).toContainText('Account state');
    await expect(page.locator('table')).toContainText('Name');
    await expect(page.locator('table')).toContainText('Email');
    await expect(page.getByRole('link', { name: 'Back', exact: true })).toBeVisible();

    const names = await page.locator('table > tbody > tr > *:nth-child(2)').allTextContents();
    const namesBeforeSorting = names.map((name) => name.toLowerCase());
    const namesAfterSorting = [...namesBeforeSorting].sort();
    expect(namesBeforeSorting).toEqual(namesAfterSorting);

    const emails = await page.locator('table > tbody > tr > *:nth-child(3)').allTextContents();
    expect(emails).toContain(activeUser.email);
    expect(emails).not.toContain(archivedUser.email);
  });
});
