Feature('v2_accessibility_tests');

Before(async ({ setupDAO, login }) => {
  await setupDAO.setupAdmin();
  login('admin');
});

Scenario('I am on manage user page',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.navigateToManageUser(testUser.email);




  // I.runA11yCheck({  detailedReportOptions: { html: true, projectKey: '12389' } });
  // I.runA11yCheck({ reportFileName: 'chand123.html' });


  I.runA11yCheck();
  I.checkA11y();


});

// Scenario('I am on search user page',  async ({ I }) => {
//   await I.navigateToSearchUser();

//   I.runA11yCheck();
//   I.checkA11y();
// });

// Scenario('I am on edit user page',  async ({ I }) => {
//   const testUser = await I.haveUser();
//   await I.navigateToEditUser(testUser.email);

//   I.runA11yCheck();
//   I.checkA11y();
// });

// Scenario('I am on generate user report page',  async ({ I }) => {
//   await I.navigateToGenerateReport();

//   I.runA11yCheck();
//   I.checkA11y();
// });

// Scenario('I am on add a new user page',  async ({ I }) => {
//   await I.navigateToRegisterUser();

//   I.runA11yCheck();
//   I.checkA11y();
// });
