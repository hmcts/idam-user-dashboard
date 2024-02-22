import { faker } from '@faker-js/faker';
Feature('v2_accessibility_tests');

Before(async ({ setupDAO, login }) => {

    await setupDAO.setupAdmin();
    login('admin');
  
});

Scenario('I as an admin can delete user successfully',  async ({ I }) => {
    const testUser = await I.haveUser();
    await I.navigateToManageUser(testUser.email);

    I.runA11yCheck({ outputDir: 'functional-output/accessibility' });
    I.checkA11y();
});

