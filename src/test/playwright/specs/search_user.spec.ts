import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/admin.fixture';
import { locateDataForTitle } from '../helpers/locators';
import { goToRegisterUser, navigateToManageUser, navigateToSearchUser } from '../helpers/navigation';
import { clickAndExpectPage } from '../helpers/resilient-actions';
import { clickAndExpectHeading } from '../helpers/ui-auth';
import { BuildInfoHelper } from '../helpers/build-info';

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

  test('I as an admin can see invitation results when an email has invitations but no established user account', async ({ page, setupDao }) => {
    const registerForename = faker.person.firstName();
    const registerSurname = faker.person.lastName();
    const registerEmail = faker.internet.email({
      firstName: registerForename,
      lastName: registerSurname,
      provider: `iud.invitation.${BuildInfoHelper.getBuildInfo()}.local`,
    }).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill(registerEmail);
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');

    await page.locator('#forename').fill(registerForename);
    await page.locator('#surname').fill(registerSurname);
    await page.getByLabel('Support', { exact: true }).click();
    await clickAndExpectHeading(page, 'Continue', 'Add new user roles');

    const workerRoleName = setupDao.getWorkerRole().name;
    const workerRoleCheckbox = page.locator(`input[name="roles"][value="${workerRoleName}"]`);
    await expect(workerRoleCheckbox).toBeVisible();
    await workerRoleCheckbox.check();
    await clickAndExpectHeading(page, 'Save', 'User registered');

    const invite = await setupDao.getSingleInvite(registerEmail);

    await navigateToSearchUser(page);
    await page.locator('[name="search"]').fill(registerEmail);
    await clickAndExpectPage(
      page,
      () => page.getByRole('button', { name: 'Search' }).click(),
      {
        expectedHeading: 'Invitation results',
        expectedUrl: /\/user\/manage/,
      }
    );

    await expect(page.locator('.govuk-notification-banner')).toContainText(
      'This email address has invitation records, but no established user account was found.'
    );
    await expect(page.locator('body')).toContainText(`1 invitation found for ${registerEmail}`);
    await expect(page.locator('.govuk-summary-card__title')).toHaveText('Invitation 1');
    await expect(page.locator('.govuk-summary-card')).toContainText(invite.invitationStatus);
    await expect(locateDataForTitle(page, 'Invitation ID')).toContainText(invite.id);
    await expect(locateDataForTitle(page, 'Invitation type')).toContainText(invite.invitationType);
    await expect(locateDataForTitle(page, 'Invitation status')).toContainText(invite.invitationStatus);
    await expect(locateDataForTitle(page, 'Email')).toContainText(registerEmail);
    await expect(locateDataForTitle(page, 'First name')).toContainText(registerForename);
    await expect(locateDataForTitle(page, 'Last name')).toContainText(registerSurname);
    await expect(locateDataForTitle(page, 'Activation roles')).toContainText(workerRoleName);
  });
});
