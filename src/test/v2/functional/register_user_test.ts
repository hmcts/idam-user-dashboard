import { faker } from '@faker-js/faker';
import { tryTo, retryTo } from 'codeceptjs/effects';
import { BuildInfoHelper } from '../common/build_info';

const ACTION_RETRY = { retries: 9, minTimeout: 250 };
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'testadmin@admin.local';

Feature('v2_register_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  await login('admin');

});

Scenario('I as an admin should be able to register support user', async ({ I, setupDAO }) => {

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'iud.register.' + BuildInfoHelper.getBuildInfo() + '.local'});
  await I.goToRegisterUser();
  I.fillField('email', registerEmail);
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Support');
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user roles');
  await retryTo(() => I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name)), ACTION_RETRY.retries);
  await I.seeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));
  await I.clickToNavigateWithNoRetry('Save', '/user/add/roles', 'User registered');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  await I.assertEqual(invite.email, registerEmail);
  await I.assertEqual(invite.invitationType, 'INVITE');
  await I.assertEqual(invite.invitationStatus, 'PENDING');

});

Scenario('I as an admin should be able to register professional user', async ({ I, setupDAO }) => {

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'iud.register.' + BuildInfoHelper.getBuildInfo() + '.local'});
  await I.goToRegisterUser();
  I.fillField('email', registerEmail);
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Professional');
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user roles');
  await retryTo(() => I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name)), ACTION_RETRY.retries);
  await I.seeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));
  await I.clickToNavigateWithNoRetry('Save', '/user/add/roles', 'User registered');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  await I.assertEqual(invite.email, registerEmail);
  await I.assertEqual(invite.invitationType, 'INVITE');
  await I.assertEqual(invite.invitationStatus, 'PENDING');

});

Scenario('I as an admin should see validation errors for invalid values', async ({ I }) => {
  await I.goToRegisterUser();
  I.fillField('email', 'email..@test.com');
  await I.clickToExpectProblem('Continue');
  I.see('The email address is not in the correct format');

  await I.goToRegisterUser();
  I.fillField('email', '@email@');
  await I.clickToExpectProblem('Continue');
  I.see('The email address is not in the correct format');

  await I.goToRegisterUser();
  I.fillField('email', 'email@com..');
  await I.clickToExpectProblem('Continue');
  I.see('The email address is not in the correct format');

  await I.goToRegisterUser();
  I.fillField('email', '');
  await I.clickToExpectProblem('Continue');
  I.see('You must enter an email address');

  await I.goToRegisterUser();
  I.fillField('email', ' ');
  await I.clickToExpectProblem('Continue');
  I.see('You must enter an email address');

  await I.goToRegisterUser();
  I.fillField('email', ADMIN_EMAIL);
  await I.clickToExpectProblem('Continue');
  I.see('The email \'' + ADMIN_EMAIL + '\' already exists');

  await I.goToRegisterUser();
  I.fillField('email', faker.internet.email());
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user details');
  I.clearField('forename');
  I.clearField('surname');
  await I.clickToExpectProblem('Continue');
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');

  await I.goToRegisterUser();
  I.fillField('email', faker.internet.email());
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', ' ');
  I.fillField('#surname', ' ');
  await I.clickToExpectProblem('Continue');
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');

  await I.goToRegisterUser();
  I.fillField('email', faker.internet.email());
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', faker.person.firstName());
  I.fillField('#surname', faker.person.lastName());
  I.click('Support');
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user roles');
  await I.clickToExpectProblem('Save');
  I.see('A user must have at least one role assigned to be able to create them');
});

Scenario('I as an admin can search for roles to add', async ({ I, setupDAO }) => {

  await I.haveRole({ name: 'iud-filter-role-' + faker.word.verb() + '-' + faker.word.noun()});
  const adminRole = setupDAO.getAdminRole();

  await I.goToRegisterUser();
  I.fillField('email', faker.internet.email());
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', faker.person.firstName());
  I.fillField('#surname', faker.person.lastName());
  I.click('Support');
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user roles');
  await retryTo(() => I.uncheckOption('#hide-disabled'), ACTION_RETRY.retries);

  I.fillField('#roles__search-box', adminRole.name);
  await tryTo(() => I.waitForVisible(I.locateRoleContainer(adminRole.name), 3));
  await retryTo(() => I.seeIsNotHidden(I.locateRoleContainer(adminRole.name)), ACTION_RETRY.retries);
  
  I.fillField('#roles__search-box', 'iud-filter-role-');
  await tryTo(() => I.waitForInvisible(I.locateRoleContainer(adminRole.name), 3));
  const numVisible = await I.grabNumberOfVisibleElements(I.locateRoleContainer(adminRole.name));
  if (numVisible > 0) {
    I.say('filter not working, trying again');
    I.clearField('#roles__search-box');
    I.fillField('#roles__search-box', 'iud-filter-role-');
    I.wait(3);
    I.scrollPageToBottom();
  }
  await retryTo(() => I.seeIsHidden(I.locateRoleContainer(adminRole.name)), ACTION_RETRY.retries);

  const roleCheckboxes = await I.grabValueFromAll(locate('//div[@class=\'govuk-checkboxes__item\' and not(@hidden)]/input[@name=\'roles\']'));
  roleCheckboxes.forEach(function (checkbox) {
    I.assertStartsWith(checkbox, 'iud-filter-role-');
  });

});
