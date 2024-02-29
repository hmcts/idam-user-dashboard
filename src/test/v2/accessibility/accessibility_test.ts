Feature('v2_accessibility_tests');

Before(async ({ setupDAO, login }) => {
  await setupDAO.setupAdmin();
  login('admin');
});

Scenario('I am on manage user page',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.navigateToManageUser(testUser.email);

  I.runA11yCheck({ reportFileName: 'manage-user-a11y-audit.html' });
});

Scenario('I am on search user page',  async ({ I }) => {
  await I.navigateToSearchUser();

  I.runA11yCheck({ reportFileName: 'search-user-a11y-audit.html' });
});

Scenario('I am on edit user page',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.navigateToEditUser(testUser.email);

  I.runA11yCheck({ reportFileName: 'edit-user-a11y-audit.html' });
});

Scenario('I am on generate user report page',  async ({ I }) => {
  await I.navigateToGenerateReport();

  I.runA11yCheck({ reportFileName: 'generate-user-report-a11y-audit.html' });
});

Scenario('I am on add a new user page',  async ({ I }) => {
  await I.navigateToRegisterUser();

  I.runA11yCheck({ reportFileName: 'add-new-user-a11y-audit.html' });
});

After(async ({ I }) => {
  I.checkA11y();
});