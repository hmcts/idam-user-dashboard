// Feature('v2_generate_report');

// Before(async ({ setupDAO, login }) => {

//   await setupDAO.setupAdmin();
//   login('admin');

// });

// Scenario('I as an admin can see errors for invalid report values', async ({ I }) => {

//   const testRole = await I.have('role');

//   I.navigateToGenerateReport();
//   I.fillField('search', 'citizen');
//   I.click('Generate report');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('For security reasons, it is not possible to get a report on all citizen users', '#search-error');

//   I.navigateToGenerateReport();
//   I.fillField('#search', ' ');
//   I.click('Generate report');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('You must enter a role or a list of roles (comma seperated)', '#search-error');

//   I.navigateToGenerateReport();
//   I.fillField('#search', 'idam-never-exists');
//   I.click('Generate report');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('There are no users with the entered role(s).');

//   I.navigateToGenerateReport();
//   I.fillField('#search', testRole.name);
//   I.click('Generate report');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('There are no users with the entered role(s).');

// });

// Scenario('I as an admin can generate a report', async ({ I }) => {

//   const testRole = await I.have('role');
//   const activeUser = await I.have('user', {roleNames: [testRole.name]});
//   const archivedUser = await I.have('user', {roleNames: [testRole.name], recordType: 'ARCHIVED'});

//   I.navigateToGenerateReport();
//   I.fillField('search', testRole.name);
//   I.click('Generate report');
//   I.wait(5);
//   I.seeAfterClick('Generated Report', 'h1');

//   I.see('Download report (CSV)');
//   I.see('Account state');
//   I.see('Name');
//   I.see('Email');
//   I.see('Back');

//   const firstNames: string[] = await I.grabTextFromAll('table > tbody > tr > *:nth-child(2)');
//   const firstNamesBeforeSorting: string[] = firstNames.map(n => n.toLowerCase());
//   const firstNamesAfterSorting: string[] = firstNames.map(n => n.toLowerCase()).sort();
//   I.assertDeepEqual(firstNamesBeforeSorting, firstNamesAfterSorting);

//   const emails: string[] = await I.grabTextFromAll('table > tbody > tr > *:nth-child(3)');
//   I.assertTrue(emails.includes(activeUser.email));
//   I.assertFalse(emails.includes(archivedUser.email));

// });