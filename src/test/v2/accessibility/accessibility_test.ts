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

  runAccessibilityCheck(I);
});

Scenario('I as an admin can remove SSO successfully',  async ({ I }) => {
  const testUser = await I.have('user', {
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });

  I.navigateToManageUser(testUser.email);
  I.click('Remove SSO');
  I.click('Continue');

  runAccessibilityCheck(I);
});

Scenario('I as an admin can generate a report', async ({ I }) => {

  const testRole = await I.have('role');

  I.navigateToGenerateReport();
  I.fillField('search', testRole.name);
  I.click('Generate report');

  runAccessibilityCheck(I);
});


Scenario('I as an admin should be able to register private beta citizen', async ({ I, setupDAO }) => {
  const privateBetaRole = await I.haveRole();
  const privateBetaService = await I.haveService({onboardingRoleNames: [privateBetaRole.name]});
  const privateBetaAdminRole = await I.haveRole({assignableRoleNames: ['citizen', privateBetaRole.name]});

  const testSecret = faker.internet.password({prefix: '0Ab'});
  const betaAdmin = await I.haveUser({
    password: testSecret, 
    roleNames: [privateBetaAdminRole.name, 'idam-user-dashboard--access']
  });
  I.loginAs(betaAdmin.email, testSecret);

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'test.local'});
  I.navigateToRegisterUser();
  I.fillField('email', registerEmail);
  I.click('Continue');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Private Beta Citizen');
  I.click('Continue');
  I.selectOption('#service', privateBetaService.clientId);

  runAccessibilityCheck(I);
});

Scenario('I as an admin should be able to register support user', async ({ I, setupDAO }) => {

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'test.local'});
  I.navigateToRegisterUser();
  I.fillField('email', registerEmail);
  I.click('Continue');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Support');
  I.click('Continue');

  runAccessibilityCheck(I);
});

Scenario('I as an admin can see errors for invalid search values',  ({ I }) => {

  I.navigateToSearchUser();
  I.fillField('search', 'email..@test.com');
  I.click('Search');

  runAccessibilityCheck(I);
});

Scenario('login as user without access', async ({ I }) => {
  const testSecret = faker.internet.password({prefix: '0Ab'});
  const testUser = await I.haveUser({password: testSecret});
  I.amOnPage('/');
  I.fillField('Email', testUser.email);
  I.fillField('Password', secret(testSecret));
  I.click('Sign in');  

  runAccessibilityCheck(I);
});

Scenario('I as an admin can suspend user',  async ({ I }) => {
  const testUser = await I.haveUser();
  I.navigateToManageUser(testUser.email);
  I.click('Suspend user');
  I.checkOption('#confirmSuspendRadio');
  I.click('Continue');

  runAccessibilityCheck(I);
});

Scenario('view admin user details',  ({ I }) => {
  const adminEmail = codeceptjs.container.support('adminIdentity').email;
  I.navigateToManageUser(adminEmail);

  runAccessibilityCheck(I);
});

async function runAccessibilityCheck(I: any) {
  I.runA11yCheck({ outputDir: 'functional-output/accessibility' });
  I.checkA11y();
}