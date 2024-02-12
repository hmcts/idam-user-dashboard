// import { faker } from '@faker-js/faker';

// Feature('v2_search_user');

// Before(async ({ setupDAO, login }) => {

//   await setupDAO.setupAdmin();
//   login('admin');

// });

// Scenario('I as an admin can see errors for invalid search values',  ({ I }) => {

//   I.navigateToSearchUser();
//   I.fillField('search', 'email..@test.com');
//   I.click('Search');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('The email address is not in the correct format');

//   I.navigateToSearchUser();
//   I.fillField('search', '@email@');
//   I.click('Search');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('The email address is not in the correct format');

//   I.navigateToSearchUser();
//   I.fillField('search', 'email@com..');
//   I.click('Search');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('The email address is not in the correct format');

//   I.navigateToSearchUser();
//   I.fillField('search', '');
//   I.click('Search');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('You must enter an email address');

//   I.navigateToSearchUser();
//   I.fillField('search', ' ');
//   I.click('Search');
//   I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
//   I.see('You must enter an email address');

// });

// Scenario('I as an admin can search for user by email, id or sso_id',  async ({ I }) => {
//   const testUser = await I.have('user', {
//     ssoId: faker.string.uuid(),
//     ssoProvider: 'idam-sso'
//   });

//   I.navigateToManageUser(testUser.email);
//   I.see(testUser.email, I.locateDataForTitle('Email'));

//   I.navigateToManageUser(testUser.id);
//   I.see(testUser.email, I.locateDataForTitle('Email'));

//   I.navigateToManageUser(testUser.ssoId);
//   I.see(testUser.email, I.locateDataForTitle('Email'));
// });

// Scenario('I as an admin can search for user by id and not clash with sso_id',  async ({ I }) => {
//   const testUser = await I.have('user');
  
//   const ssoUser = await I.have('user', {
//     ssoId: testUser.id,
//     ssoProvider: 'idam-sso'
//   });

//   I.navigateToManageUser(testUser.id);
//   I.see(testUser.email, I.locateDataForTitle('Email'));
//   I.dontSee(ssoUser.email, I.locateDataForTitle('Email'));
// });