import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/admin.fixture';
import { locateDataForTitle } from '../helpers/locators';
import { navigateToManageUser, navigateToSearchUser } from '../helpers/navigation';

test.describe('search_user', () => {
  test('I as an admin can see errors for invalid search values', async ({ page }) => {
    await navigateToSearchUser(page);
    await page.locator('[name="search"]').fill('email..@test.com');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await navigateToSearchUser(page);
    await page.locator('[name="search"]').fill('@email@');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await navigateToSearchUser(page);
    await page.locator('[name="search"]').fill('email@com..');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await navigateToSearchUser(page);
    await page.locator('[name="search"]').fill('');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText('You must enter an email address');

    await navigateToSearchUser(page);
    await page.locator('[name="search"]').fill(' ');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText('You must enter an email address');
  });

  test('I as an admin can search for user by email, id or sso_id', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({
      ssoId: faker.string.uuid(),
      ssoProvider: 'idam-sso',
    });

    await navigateToManageUser(page, testUser.email);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);

    await navigateToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);

    await navigateToManageUser(page, testUser.ssoId!);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
  });

  test('I as an admin can search for user by id and not clash with sso_id', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    const ssoUser = await setupDao.createUser({
      ssoId: testUser.id,
      ssoProvider: 'idam-sso',
    });

    await navigateToManageUser(page, testUser.id);
    await expect(locateDataForTitle(page, 'Email')).toContainText(testUser.email);
    await expect(locateDataForTitle(page, 'Email')).not.toContainText(ssoUser.email);
  });
});
