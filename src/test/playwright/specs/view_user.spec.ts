import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/admin.fixture';
import { locateDataForTitle, locateStrongDataForTitle } from '../helpers/locators';
import { goToManageUser, navigateToManageUser } from '../helpers/navigation';

test.describe('view_user', () => {
  test('view admin user details', async ({ page, setupDao }) => {
    const admin = setupDao.getAdminIdentity();
    await navigateToManageUser(page, admin.email);
    await expect(locateDataForTitle(page, 'Email')).toContainText(admin.email);
  });

  test('view test user details', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('IDAM');
    await expect(page.locator('dt', { hasText: 'IdP User ID' })).toHaveCount(0);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/active/i);
  });

  test('view test user with sso details', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({
      ssoId: faker.string.uuid(),
      ssoProvider: 'idam-sso',
    });
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('idam-sso');
    await expect(locateDataForTitle(page, 'IdP User ID')).toContainText(testUser.ssoId!);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/active/i);
  });

  test('view test user with ejudiciary provider details', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({
      ssoId: faker.string.uuid(),
      ssoProvider: 'azure',
    });
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('eJudiciary.net');
    await expect(locateDataForTitle(page, 'eJudiciary User ID')).toContainText(testUser.ssoId!);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/active/i);
    await expect(page.locator('div.govuk-notification-banner')).toContainText('Please check with the eJudiciary support team to see if there are related accounts.');
  });

  test('view suspended user details', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({ accountStatus: 'SUSPENDED' });
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('IDAM');
    await expect(page.locator('dt', { hasText: 'IdP User ID' })).toHaveCount(0);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/suspended/i);
  });

  test('view locked user details', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await setupDao.lockTestUser(testUser.email);
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('IDAM');
    await expect(page.locator('dt', { hasText: 'IdP User ID' })).toHaveCount(0);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/locked/i);
    await expect(page.locator('div.govuk-warning-text')).toContainText('This account has been temporarily locked');
  });

  test('view archived user details', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({ recordType: 'ARCHIVED' });
    await goToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Identity Provider')).toContainText('IDAM');
    await expect(page.locator('dt', { hasText: 'IdP User ID' })).toHaveCount(0);
    await expect(locateStrongDataForTitle(page, 'Account state')).toContainText(/archived/i);
    await expect(page.locator('div.govuk-notification-banner')).toContainText('Archived accounts are read only.');
  });
});
