import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/admin.fixture';
import { locateDataForTitle } from '../helpers/locators';
import { goToManageUser } from '../helpers/navigation';

test.describe('edit_user_remove_sso', () => {
  test('I as an admin can remove SSO successfully', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({
      ssoId: faker.string.uuid(),
      ssoProvider: 'azure',
    });
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('eJudiciary.net');
    await expect(locateDataForTitle(page, 'eJudiciary User ID')).toContainText(testUser.ssoId as string);

    await expect(page.getByRole('button', { name: 'Remove SSO' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove SSO' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to remove single sign-on');
    await page.locator('#confirmRadio').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('Single sign-on removed successfully');

    await page.getByRole('button', { name: 'Return to user details' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('IDAM');
    await expect(page.locator('dt', { hasText: 'IdP User ID' })).toHaveCount(0);
  });

  test('I as an admin can cancel removing SSO', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({
      ssoId: faker.string.uuid(),
      ssoProvider: 'azure',
    });
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('eJudiciary.net');
    await expect(locateDataForTitle(page, 'eJudiciary User ID')).toContainText(testUser.ssoId as string);

    await expect(page.getByRole('button', { name: 'Remove SSO' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove SSO' }).click();
    await expect(page.locator('h1')).toContainText('Are you sure you want to remove single sign-on');
    await page.locator('#confirmRadio-2').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('eJudiciary.net');
    await expect(locateDataForTitle(page, 'eJudiciary User ID')).toContainText(testUser.ssoId as string);
  });
});
