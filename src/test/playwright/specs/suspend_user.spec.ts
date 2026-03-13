import { test, expect } from '../fixtures/admin.fixture';
import { locateDataForTitle, locateStrongDataForTitle } from '../helpers/locators';
import { goToManageUser } from '../helpers/navigation';

test.describe('suspend_user', () => {
  test('I as an admin can suspend user', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await goToManageUser(page, testUser.id);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/active/i);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(page.getByRole('button', { name: 'Suspend user' })).toBeVisible();
    await page.getByRole('button', { name: 'Suspend user' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to suspend');
    await page.locator('#confirmSuspendRadio').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('User suspended successfully');
    await page.getByRole('button', { name: 'Return to user details' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/suspended/i);
  });

  test('I as an admin can cancel suspending a user', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await goToManageUser(page, testUser.id);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/active/i);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(page.getByRole('button', { name: 'Suspend user' })).toBeVisible();
    await page.getByRole('button', { name: 'Suspend user' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to suspend');
    await page.locator('#confirmSuspendRadio-2').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/active/i);
  });

  test('I as an admin can unsuspend user', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({ accountStatus: 'SUSPENDED' });
    await goToManageUser(page, testUser.id);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/suspended/i);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(page.getByRole('button', { name: 'Unsuspend user' })).toBeVisible();
    await page.getByRole('button', { name: 'Unsuspend user' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to unsuspend');
    await page.locator('#confirmUnSuspendRadio').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('User unsuspended successfully');
    await page.getByRole('button', { name: 'Return to user details' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/active/i);
  });

  test('I as an admin can cancel unsuspending a user', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({ accountStatus: 'SUSPENDED' });
    await goToManageUser(page, testUser.id);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/suspended/i);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(page.getByRole('button', { name: 'Unsuspend user' })).toBeVisible();
    await page.getByRole('button', { name: 'Unsuspend user' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to unsuspend');
    await page.locator('#confirmUnSuspendRadio-2').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/suspended/i);
  });
});
