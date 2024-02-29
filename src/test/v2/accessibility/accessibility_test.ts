Feature('v2_accessibility_tests');

Before(async ({ setupDAO, login }) => {
  await setupDAO.setupAdmin();
  login('admin');
});

Scenario('I am on manage user page',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.navigateToManageUser(testUser.email);

  I.checkA11y(I, 'manage-user-a11y-audit.html');
});

Scenario('I am on search user page',  async ({ I }) => {
  await I.navigateToSearchUser();

  I.checkA11y(I, 'search-user-a11y-audit.html');
});

Scenario('I am on edit user page',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.navigateToEditUser(testUser.email);

  I.checkA11y(I, 'edit-user-a11y-audit.html');
});

Scenario('I am on generate user report page',  async ({ I }) => {
  await I.navigateToGenerateReport();

  I.checkA11y(I, 'generate-user-report-a11y-audit.html' );
});

Scenario('I am on add a new user page',  async ({ I }) => {
  await I.navigateToRegisterUser();

  I.checkA11y(I, 'add-new-user-a11y-audit.html');
});