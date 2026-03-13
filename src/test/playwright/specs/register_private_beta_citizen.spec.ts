import { faker } from '@faker-js/faker';
import { test, expect } from '../fixtures/base.fixture';
import { BuildInfoHelper } from '../helpers/build-info';
import { clickAndExpectHeading, loginAs } from '../helpers/ui-auth';

test.describe('register_private_beta', () => {
  test.beforeEach(async ({ setupDao }) => {
    await setupDao.setupAdmin();
  });

  test('I as an admin should be able to register private beta citizen', async ({ page, setupDao }) => {
    const privateBetaRoleName = `iud-role-${BuildInfoHelper.getBuildInfo(faker.word.verb())}-${faker.word.noun()}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    await setupDao.createRole({ name: privateBetaRoleName });
    const privateBetaService = await setupDao.createService({ onboardingRoleNames: [privateBetaRoleName] });

    const privateBetaAdminRoleName = `iud-role-${BuildInfoHelper.getBuildInfo(faker.word.verb())}-${faker.word.noun()}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    await setupDao.createRole({ name: privateBetaAdminRoleName, assignableRoleNames: ['citizen', privateBetaRoleName] });

    const betaAdmin = await setupDao.createUser({
      roleNames: [privateBetaAdminRoleName, 'idam-user-dashboard--access'],
    });
    await loginAs(page, betaAdmin.email, betaAdmin.password);
    await expect(page.locator('h1')).toHaveText('What do you want to do?');

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

    await page.locator('#forename').fill(registerForename);
    await page.locator('#surname').fill(registerSurname);
    await page.getByLabel('Private Beta Citizen', { exact: true }).click();
    await clickAndExpectHeading(page, 'Continue', 'Add a new user');
    await expect(page.locator('body')).toContainText('Please select a service you would want to associate with the private beta citizen');

    await page.selectOption('#service', privateBetaService.clientId);
    await clickAndExpectHeading(page, 'Save', 'User registered');

    const invite = await setupDao.getSingleInvite(registerEmail);
    expect(invite.email).toBe(registerEmail);
    expect(invite.invitationType).toBe('INVITE');
    expect(invite.invitationStatus).toBe('PENDING');
  });
});
