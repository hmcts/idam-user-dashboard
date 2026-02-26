Feature('v2_generate_report');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  await login('admin');

});

Scenario('I as an admin can see errors for invalid report values', async ({ I }) => {

  const testRole = await I.haveRole();

  await I.navigateToGenerateReport();
  I.fillField('search', 'citizen');
  await I.clickToExpectProblem('Generate report');
  I.see('For security reasons, it is not possible to get a report on all citizen users', '#search-error');

  await I.navigateToGenerateReport();
  I.fillField('#search', ' ');
  await I.clickToExpectProblem('Generate report');
  I.see('You must enter a role or a list of roles (comma seperated)', '#search-error');

  await I.navigateToGenerateReport();
  I.fillField('#search', 'idam-never-exists');
  await I.clickToExpectProblem('Generate report');
  I.see('There are no users with the entered role(s).');

  await I.navigateToGenerateReport();
  I.fillField('#search', testRole.name);
  await I.clickToExpectProblem('Generate report');
  I.see('There are no users with the entered role(s).');

});

Scenario('I as an admin can generate a report', async ({ I }) => {

  const testRole = await I.haveRole();
  const activeUser = await I.haveUser({roleNames: [testRole.name]});
  const archivedUser = await I.haveUser({roleNames: [testRole.name], recordType: 'ARCHIVED'});

  await I.navigateToGenerateReport();
  I.fillField('search', testRole.name);
  I.click('Generate report');
  I.wait(5);
  I.seeAfterClick('Generated Report', 'h1');

  I.see('Download report (CSV)');
  I.see('Account state');
  I.see('Name');
  I.see('Email');
  I.see('Back');

  const firstNames: string[] = await I.grabTextFromAll('table > tbody > tr > *:nth-child(2)');
  const firstNamesBeforeSorting: string[] = firstNames.map(n => n.toLowerCase());
  const firstNamesAfterSorting: string[] = firstNames.map(n => n.toLowerCase()).sort();
  I.assertDeepEqual(firstNamesBeforeSorting, firstNamesAfterSorting);

  const emails: string[] = await I.grabTextFromAll('table > tbody > tr > *:nth-child(3)');
  I.assertTrue(emails.includes(activeUser.email));
  I.assertFalse(emails.includes(archivedUser.email));

});