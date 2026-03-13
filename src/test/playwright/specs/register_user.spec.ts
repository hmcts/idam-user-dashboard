import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/admin.fixture';
import { BuildInfoHelper } from '../helpers/build-info';
import { roleContainer } from '../helpers/locators';
import { goToRegisterUser } from '../helpers/navigation';
import { clickAndExpectHeading } from '../helpers/ui-auth';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'testadmin@admin.local';

async function submitAndExpectProblem(page: Page): Promise<void> {
  await clickAndExpectHeading(page, 'Continue', 'Add new user email');
  await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
}

test.describe('register_user', () => {
  test('I as an admin should be able to register support user', async ({ page, setupDao }) => {
    const registerForename = faker.person.firstName();
    const registerSurname = faker.person.lastName();
    const registerEmail = faker.internet.email({
      firstName: registerForename,
      lastName: registerSurname,
      provider: `iud.register.${BuildInfoHelper.getBuildInfo()}.local`,
    });

    await page.goto('/user/add');
    await expect(page.locator('h1')).toHaveText('Add new user email');
    await page.locator('[name="email"]').fill(registerEmail);
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');
    await expect(page).toHaveURL(/\/user\/add\/details/);

    await page.locator('#forename').fill(registerForename);
    await page.locator('#surname').fill(registerSurname);
    await page.getByLabel('Support', { exact: true }).click();
    await clickAndExpectHeading(page, 'Continue', 'Add new user roles');
    await expect(page).toHaveURL(/\/user\/add\/details/);

    const workerRoleName = setupDao.getWorkerRole().name;
    const workerRoleCheckbox = page.locator(`input[name="roles"][value="${workerRoleName}"]`);
    await expect(workerRoleCheckbox).toBeVisible();
    await workerRoleCheckbox.check();
    await expect(workerRoleCheckbox).toBeChecked();

    await clickAndExpectHeading(page, 'Save', 'User registered');
    await expect(page).toHaveURL(/\/user\/add\/roles/);

    const invite = await setupDao.getSingleInvite(registerEmail);
    expect(invite.email).toBe(registerEmail);
    expect(invite.invitationType).toBe('INVITE');
    expect(invite.invitationStatus).toBe('PENDING');
  });

  test('I as an admin should be able to register professional user', async ({ page, setupDao }) => {
    const registerForename = faker.person.firstName();
    const registerSurname = faker.person.lastName();
    const registerEmail = faker.internet.email({
      firstName: registerForename,
      lastName: registerSurname,
      provider: `iud.register.${BuildInfoHelper.getBuildInfo()}.local`,
    });

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill(registerEmail);
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');
    await expect(page).toHaveURL(/\/user\/add\/details/);

    await page.locator('#forename').fill(registerForename);
    await page.locator('#surname').fill(registerSurname);
    await page.getByLabel('Professional', { exact: true }).click();
    await clickAndExpectHeading(page, 'Continue', 'Add new user roles');
    await expect(page).toHaveURL(/\/user\/add\/details/);

    const workerRoleName = setupDao.getWorkerRole().name;
    const workerRoleCheckbox = page.locator(`input[name="roles"][value="${workerRoleName}"]`);
    await expect(workerRoleCheckbox).toBeVisible();
    await workerRoleCheckbox.check();
    await expect(workerRoleCheckbox).toBeChecked();

    await clickAndExpectHeading(page, 'Save', 'User registered');
    await expect(page).toHaveURL(/\/user\/add\/roles/);

    const invite = await setupDao.getSingleInvite(registerEmail);
    expect(invite.email).toBe(registerEmail);
    expect(invite.invitationType).toBe('INVITE');
    expect(invite.invitationStatus).toBe('PENDING');
  });

  test('I as an admin should see validation errors for invalid values', async ({ page }) => {
    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill('email..@test.com');
    await submitAndExpectProblem(page);
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill('@email@');
    await submitAndExpectProblem(page);
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill('email@com..');
    await submitAndExpectProblem(page);
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill('');
    await submitAndExpectProblem(page);
    await expect(page.locator('body')).toContainText('You must enter an email address');

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill(' ');
    await submitAndExpectProblem(page);
    await expect(page.locator('body')).toContainText('You must enter an email address');

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill(ADMIN_EMAIL);
    await submitAndExpectProblem(page);
    await expect(page.locator('body')).toContainText(`The email '${ADMIN_EMAIL}' already exists`);

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill(faker.internet.email());
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');
    await page.locator('#forename').fill('');
    await page.locator('#surname').fill('');
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText('You must enter a forename for the user');
    await expect(page.locator('body')).toContainText('You must enter a surname for the user');

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill(faker.internet.email());
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');
    await page.locator('#forename').fill(' ');
    await page.locator('#surname').fill(' ');
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText('You must enter a forename for the user');
    await expect(page.locator('body')).toContainText('You must enter a surname for the user');

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill(faker.internet.email());
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');
    await page.locator('#forename').fill(faker.person.firstName());
    await page.locator('#surname').fill(faker.person.lastName());
    await page.getByLabel('Support', { exact: true }).click();
    await clickAndExpectHeading(page, 'Continue', 'Add new user roles');
    await clickAndExpectHeading(page, 'Save', 'Add new user roles');
    await expect(page.locator('h2.govuk-error-summary__title')).toHaveText('There is a problem');
    await expect(page.locator('body')).toContainText('A user must have at least one role assigned to be able to create them');
  });

  test('I as an admin can search for roles to add', async ({ page, setupDao }) => {
    const filterRoleName = `iud-filter-role-${faker.word.verb()}-${faker.word.noun()}`;
    await setupDao.createRole({ name: filterRoleName });
    const adminRoleName = setupDao.getAdminRole().name;

    await goToRegisterUser(page);
    await page.locator('[name="email"]').fill(faker.internet.email());
    await clickAndExpectHeading(page, 'Continue', 'Add new user details');
    await page.locator('#forename').fill(faker.person.firstName());
    await page.locator('#surname').fill(faker.person.lastName());
    await page.getByLabel('Support', { exact: true }).click();
    await clickAndExpectHeading(page, 'Continue', 'Add new user roles');

    const hideDisabledCheckbox = page.locator('#hide-disabled');
    await expect(hideDisabledCheckbox).toBeVisible();
    await hideDisabledCheckbox.uncheck();

    const adminRoleCheckbox = page.locator(`input[name="roles"][value="${adminRoleName}"]`);
    const adminRoleContainer = roleContainer(page, adminRoleName);

    await page.locator('#roles__search-box').fill(adminRoleName);
    await expect(adminRoleCheckbox).toBeVisible();
    await expect(adminRoleContainer).toBeVisible();

    await page.locator('#roles__search-box').fill('iud-filter-role-');
    await expect(adminRoleContainer).toBeHidden();

    const visibleRoleCheckboxes = page.locator('//div[@class=\'govuk-checkboxes__item\' and not(@hidden)]/input[@name=\'roles\']');
    const roleValues = await visibleRoleCheckboxes.evaluateAll((elements) => elements.map((el) => (el as HTMLInputElement).value));
    expect(roleValues.length).toBeGreaterThan(0);
    roleValues.forEach((roleValue) => {
      expect(roleValue.startsWith('iud-filter-role-')).toBeTruthy();
    });
  });
});
