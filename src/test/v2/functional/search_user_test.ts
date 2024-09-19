import { faker } from '@faker-js/faker';

Feature('v2_search_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin can see errors for invalid search values', async ({ I }) => {

  await I.navigateToSearchUser();
  await I.fillField('search', 'email..@test.com');
  await I.clickToExpectProblem('Search');
  I.see('The email address is not in the correct format');

  await I.navigateToSearchUser();
  await I.fillField('search', '@email@');
  await I.clickToExpectProblem('Search');
  I.see('The email address is not in the correct format');

  await I.navigateToSearchUser();
  await I.fillField('search', 'email@com..');
  await I.clickToExpectProblem('Search');
  I.see('The email address is not in the correct format');

  await I.navigateToSearchUser();
  await I.fillField('search', '');
  await I.clickToExpectProblem('Search');
  I.see('You must enter an email address');

  await I.navigateToSearchUser();
  await I.fillField('search', ' ');
  await I.clickToExpectProblem('Search');
  I.see('You must enter an email address');

});

Scenario('I as an admin can search for user by email, id or sso_id',  async ({ I }) => {
  const testUser = await I.haveUser({
    ssoId: faker.string.uuid(),
    ssoProvider: 'idam-sso'
  });

  await I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));

  await I.navigateToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));

  await I.navigateToManageUser(testUser.ssoId);
  I.see(testUser.email, I.locateDataForTitle('Email'));
});

Scenario('I as an admin can search for user by id and not clash with sso_id',  async ({ I }) => {
  const testUser = await I.haveUser();
  
  const ssoUser = await I.haveUser({
    ssoId: testUser.id,
    ssoProvider: 'idam-sso'
  });

  await I.navigateToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.dontSee(ssoUser.email, I.locateDataForTitle('Email'));
});