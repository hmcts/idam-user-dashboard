import { faker } from '@faker-js/faker';
Feature('v2_accessibility_tests');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin can delete user successfully',  async ({ I }) => {
  const testUser = await I.have('user');
  I.navigateToManageUser(testUser.email);
  I.click('Delete user');
  I.runA11yCheck({ outputDir: 'a11y' });
  I.checkA11y();
});

Scenario('I as an admin can remove SSO successfully',  async ({ I }) => {
  const testUser = await I.have('user', {
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });

  I.navigateToManageUser(testUser.email);
  I.click('Remove SSO');
  I.click('Continue');
  I.runA11yCheck({ outputDir: 'a11y' });
  I.checkA11y();
});

Scenario('I as an admin can generate a report', async ({ I }) => {

  const testRole = await I.have('role');

  I.navigateToGenerateReport();
  I.fillField('search', testRole.name);
  I.click('Generate report');
  I.runA11yCheck({ outputDir: 'a11y' });
  I.checkA11y();
});
