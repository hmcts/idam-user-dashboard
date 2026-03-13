import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/admin.fixture';
import { BuildInfoHelper } from '../helpers/build-info';
import { saveExpectProblem, saveExpectSuccess } from '../helpers/form-actions';
import {
  locateDataForTitle,
  locateStrongDataForTitle,
  roleContainer,
  roleInput,
} from '../helpers/locators';
import { navigateToEditUser } from '../helpers/navigation';

test.describe('edit_user', () => {
  test('I as an admin should edit user details successfully', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#forename')).toHaveValue(testUser.forename);
    await expect(page.locator('#surname')).toHaveValue(testUser.surname);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await expect(roleInput(page, setupDao.getWorkerRole().name)).toBeChecked();

    const changedForename = faker.person.firstName();
    const changedSurname = faker.person.lastName();
    const changedEmail = faker.internet.email({
      firstName: changedForename,
      lastName: changedSurname,
      provider: `iud.changed.${BuildInfoHelper.getBuildInfo()}.local`,
    });
    await page.locator('#forename').fill(changedForename);
    await page.locator('#surname').fill(changedSurname);
    await page.locator('#email').fill(changedEmail);
    await saveExpectSuccess(page);

    await expect(page.locator('#forename')).toHaveValue(changedForename);
    await expect(page.locator('#surname')).toHaveValue(changedSurname);
    await expect(page.locator('#email')).toHaveValue(changedEmail);
    await expect(roleInput(page, setupDao.getWorkerRole().name)).toBeChecked();

    await page.getByRole('button', { name: 'Return to user details' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(page.getByRole('button', { name: 'Suspend user' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete user' })).toBeVisible();
  });

  test('I as an admin can only edit roles if I can manage them', async ({ page, setupDao }) => {
    const testRoleName = `iud-role-${faker.word.verb()}-${faker.word.noun()}`;
    await setupDao.createRole({ name: testRoleName });
    const testUser = await setupDao.createUser({ roleNames: [testRoleName] });

    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await page.locator('#hide-disabled').uncheck();
    await expect(roleInput(page, testRoleName)).toBeChecked();
    await expect(roleInput(page, testRoleName)).toBeDisabled();
    await expect(roleInput(page, setupDao.getWorkerRole().name)).not.toBeChecked();

    await roleInput(page, setupDao.getWorkerRole().name).check();
    await expect(roleInput(page, setupDao.getWorkerRole().name)).toBeChecked();
    await saveExpectSuccess(page);

    await page.getByRole('button', { name: 'Return to user details' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateDataForTitle(page, 'Assigned roles')).toContainText(setupDao.getWorkerRole().name);
    await expect(page.getByRole('button', { name: 'Delete user' })).toHaveCount(0);
  });

  test('I as an admin should see validation errors for invalid values', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();

    await navigateToEditUser(page, testUser.id);
    await page.locator('#email').fill('email..@test.com');
    await saveExpectProblem(page);
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await navigateToEditUser(page, testUser.id);
    await page.locator('#email').fill('@email@');
    await saveExpectProblem(page);
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await navigateToEditUser(page, testUser.id);
    await page.locator('#email').fill('email@com..');
    await saveExpectProblem(page);
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await navigateToEditUser(page, testUser.id);
    await page.locator('#forename').fill('');
    await page.locator('#surname').fill('');
    await page.locator('#email').fill('');
    await saveExpectProblem(page);
    await expect(page.locator('body')).toContainText('You must enter a forename for the user');
    await expect(page.locator('body')).toContainText('You must enter a surname for the user');
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await navigateToEditUser(page, testUser.id);
    await page.locator('#forename').fill(' ');
    await page.locator('#surname').fill(' ');
    await page.locator('#email').fill(' ');
    await saveExpectProblem(page);
    await expect(page.locator('body')).toContainText('You must enter a forename for the user');
    await expect(page.locator('body')).toContainText('You must enter a surname for the user');
    await expect(page.locator('body')).toContainText('The email address is not in the correct format');

    await navigateToEditUser(page, testUser.id);
    await saveExpectProblem(page);
    await expect(page.locator('body')).toContainText('No changes to the user were made');
  });

  test('I as an admin can enable MFA', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({ roleNames: ['idam-mfa-disabled', setupDao.getWorkerRole().name] });
    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    const mfa = page.locator('input[name="multiFactorAuthentication"]');
    await expect(mfa).not.toBeChecked();

    await mfa.check();
    await expect(mfa).toBeChecked();
    await saveExpectSuccess(page);
    await page.getByRole('button', { name: 'Return to user details' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateStrongDataForTitle(page, 'Multi-factor authentication')).toContainText(/enabled/i);
  });

  test('I as an admin cannot edit values for SSO users', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({
      ssoId: faker.string.uuid(),
      ssoProvider: 'azure',
    });
    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('input[name="email"]')).toBeDisabled();
  });

  test('I as an admin can filter roles', async ({ page, setupDao }) => {
    const testRoleName = `iud-filter-role-${faker.word.verb()}-${faker.word.noun()}`;
    await setupDao.createRole({ name: testRoleName });
    const adminRole = setupDao.getAdminRole();
    const testUser = await setupDao.createUser({ roleNames: [testRoleName, adminRole.name] });

    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await page.locator('#hide-disabled').uncheck();

    await page.locator('#roles__search-box').fill(adminRole.name);
    await expect(roleContainer(page, adminRole.name)).toBeVisible();

    await page.locator('#roles__search-box').fill('iud-filter-role-');
    await expect(roleContainer(page, adminRole.name)).toBeHidden();
    await expect(roleContainer(page, testRoleName)).toBeVisible();
    await expect(roleInput(page, testRoleName)).toBeChecked();

    const roleValues = await page.locator('//div[@class=\'govuk-checkboxes__item\' and not(@hidden)]/input[@name=\'roles\']')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
    roleValues.forEach((value) => expect(value.startsWith('iud-filter-role-')).toBeTruthy());
  });

  test('I as an admin can add a filtered role and existing roles are unchanged', async ({ page, setupDao }) => {
    const testRoleName = `iud-user-role-${faker.word.verb()}-${faker.word.noun()}`;
    await setupDao.createRole({ name: testRoleName });
    const workerRole = setupDao.getWorkerRole();
    const testUser = await setupDao.createUser({ roleNames: [testRoleName] });

    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await page.locator('#hide-disabled').uncheck();
    await page.locator('#roles__search-box').fill(workerRole.name);
    await expect(roleContainer(page, workerRole.name)).toBeVisible();

    await roleInput(page, workerRole.name).check();
    await expect(roleInput(page, workerRole.name)).toBeChecked();
    await saveExpectSuccess(page);

    await page.getByRole('button', { name: 'Return to user details' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateDataForTitle(page, 'Assigned roles')).toContainText(testRoleName);
    await expect(locateDataForTitle(page, 'Assigned roles')).toContainText(workerRole.name);
  });

  test('I as an admin cannot edit the citizen attribute', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({ roleNames: [setupDao.getWorkerRole().name, 'citizen'] });
    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await page.locator('#hide-disabled').uncheck();

    await expect(page.getByText('Citizen role', { exact: true })).toBeVisible();
    await expect(page.locator('input[name="isCitizen"]')).toBeChecked();
    await expect(page.locator('input[name="isCitizen"]')).toBeDisabled();
  });

  test('I as an admin can remove the citizen attribute if there is a caseworker conflict', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser({
      roleNames: ['caseworker', 'citizen'],
      ssoId: faker.string.uuid(),
      ssoProvider: 'azure',
    });
    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await page.locator('#hide-disabled').uncheck();

    await expect(page.getByText('Citizen role', { exact: true })).toBeVisible();
    await expect(page.locator('div.govuk-warning-text')).toContainText('This user should probably not be a citizen.');
    const citizen = page.locator('input[name="isCitizen"]');
    await expect(citizen).toBeChecked();
    await expect(citizen).toBeEnabled();

    await citizen.uncheck();
    await expect(citizen).not.toBeChecked();
    await saveExpectSuccess(page);

    await page.getByRole('button', { name: 'Return to user details' }).click();
    await expect(page.locator('h1')).toHaveText('User Details');
    await expect(locateDataForTitle(page, 'Assigned roles')).not.toContainText('citizen');

    await navigateToEditUser(page, testUser.id);
    await expect(page.getByText('Citizen role', { exact: true })).toHaveCount(0);
  });

  test('I as an admin cannot change a user email if there is a conflict', async ({ page, setupDao }) => {
    const conflictUser = await setupDao.createUser();
    const testUser = await setupDao.createUser();
    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#forename')).toHaveValue(testUser.forename);
    await expect(page.locator('#surname')).toHaveValue(testUser.surname);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await expect(roleInput(page, setupDao.getWorkerRole().name)).toBeChecked();

    await page.locator('#email').fill(conflictUser.email);
    await saveExpectProblem(page);
    await expect(page.locator('body')).toContainText('A user with this email address already exists');
  });

  test('I as an admin cannot change a user email if the account is archived', async ({ page, setupDao }) => {
    const testUser = await setupDao.createUser();
    await navigateToEditUser(page, testUser.id);
    await expect(page.locator('#forename')).toHaveValue(testUser.forename);
    await expect(page.locator('#surname')).toHaveValue(testUser.surname);
    await expect(page.locator('#email')).toHaveValue(testUser.email);
    await expect(roleInput(page, setupDao.getWorkerRole().name)).toBeChecked();

    await setupDao.archiveExistingTestUser(testUser);
    const changedEmail = faker.internet.email({
      firstName: testUser.forename,
      lastName: testUser.surname,
      provider: `iud.changed.${BuildInfoHelper.getBuildInfo()}.local`,
    });
    await page.locator('#email').fill(changedEmail);
    await saveExpectProblem(page);
    await expect(page.locator('body')).toContainText('Cannot update archived user');
  });
});
