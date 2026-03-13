import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/admin.fixture';
import { locateDataForTitle, locateStrongDataForTitle } from '../helpers/locators';
import { goToManageUser } from '../helpers/navigation';

test.describe('delete_user', () => {
  test('I as an admin can delete user successfully', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(page.getByRole('button', { name: 'Delete user' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete user' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to delete');
    await page.locator('#confirmRadio').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('User deleted successfully');

    await page.getByRole('button', { name: 'Return to main menu' }).click();
    await expect(page.locator('h1')).toHaveText('What do you want to do?');
    await page.getByLabel('Manage an existing user', { exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('Search for an existing user');
    await page.locator('[name="search"]').fill(testUser.email);
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText(`No user matches your search for: ${testUser.email}`);
  });

  test('I as an admin cannot delete user with unmanageable roles', async ({ page, setupDao }) => {
    const unmanagedRoleName = `iud-role-${faker.word.verb()}-${faker.word.noun()}`;
    await setupDao.createRole({ name: unmanagedRoleName });
    const workerRoleName = setupDao.getWorkerRole().name;
    const testUser = await setupDao.createUser({ roleNames: [unmanagedRoleName, workerRoleName] });

    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(page.getByRole('button', { name: 'Delete user' })).toHaveCount(0);
  });

  test('I as an admin can delete archived user successfully', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({ recordType: 'ARCHIVED' });
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/archived/i);
    await expect(page.getByRole('button', { name: 'Delete user' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete user' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to delete');
    await page.locator('#confirmRadio').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('User deleted successfully');

    await page.getByRole('button', { name: 'Return to main menu' }).click();
    await expect(page.locator('h1')).toHaveText('What do you want to do?');
    await page.getByLabel('Manage an existing user', { exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('Search for an existing user');
    await page.locator('[name="search"]').fill(testUser.email);
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText(`No user matches your search for: ${testUser.email}`);
  });

  test('I as an admin can cancel deleting a user', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(page.getByRole('button', { name: 'Delete user' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete user' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to delete');
    await page.locator('#confirmRadio-2').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
  });
});
