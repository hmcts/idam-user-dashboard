import { faker } from '@faker-js/faker';

Feature('v2_register_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin should be able to register support user', async ({ I, setupDAO }) => {

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'test.local'});
  await I.navigateToRegisterUser();
  I.fillField('email', registerEmail);
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Support');
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user roles');
  I.wait(3);
  I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name));
  await I.clickToNavigate('Save', '/user/add/roles', 'User registered');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  I.assertEqual(invite.email, registerEmail);
  I.assertEqual(invite.invitationType, 'INVITE');
  I.assertEqual(invite.invitationStatus, 'PENDING');

});

Scenario('I as an admin should be able to register professional user', async ({ I, setupDAO }) => {

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'test.local'});
  await I.navigateToRegisterUser();
  I.fillField('email', registerEmail);
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Professional');
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user roles');
  I.wait(3);
  I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name));
  await I.clickToNavigate('Save', '/user/add/roles', 'User registered');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  I.assertEqual(invite.email, registerEmail);
  I.assertEqual(invite.invitationType, 'INVITE');
  I.assertEqual(invite.invitationStatus, 'PENDING');

});

Scenario('I as an admin should see validation errors for invalid values', async ({ I }) => {
  await I.navigateToRegisterUser();
  I.fillField('email', 'email..@test.com');
  await I.clickToExpectProblem('Continue');
  I.see('The email address is not in the correct format');
  
  await I.navigateToRegisterUser();
  I.fillField('email', '@email@');
  await I.clickToExpectProblem('Continue');
  I.see('The email address is not in the correct format');
  
  await I.navigateToRegisterUser();
  I.fillField('email', 'email@com..');
  await I.clickToExpectProblem('Continue');
  I.see('The email address is not in the correct format');
  
  await I.navigateToRegisterUser();
  I.fillField('email', '');
  await I.clickToExpectProblem('Continue');
  I.see('You must enter an email address');

  await I.navigateToRegisterUser();
  I.fillField('email', ' ');
  await I.clickToExpectProblem('Continue');
  I.see('You must enter an email address');

  await I.navigateToRegisterUser();
  I.fillField('email', codeceptjs.container.support('adminIdentity').email);
  await I.clickToExpectProblem('Continue');
  I.see('The email \'' + codeceptjs.container.support('adminIdentity').email + '\' already exists');

  await I.navigateToRegisterUser();
  I.fillField('email', faker.internet.email());
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user details');
  I.clearField('forename');
  I.clearField('surname');
  await I.clickToExpectProblem('Continue');
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  
  await I.navigateToRegisterUser();
  I.fillField('email', faker.internet.email());
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', ' ');
  I.fillField('#surname', ' ');
  await I.clickToExpectProblem('Continue');
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  
  await I.navigateToRegisterUser();
  I.fillField('email', faker.internet.email());
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', faker.person.firstName());
  I.fillField('#surname', faker.person.lastName());
  I.click('Support');
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user roles');
  await I.clickToExpectProblem('Save');
  I.see('A user must have at least one role assigned to be able to create them');
});

Scenario('I as an admin can search for roles to add', async ({ I }) => {

  await I.haveRole({ name: 'iud-filter-role-' + faker.word.verb() + '-' + faker.word.noun()});

  await I.navigateToRegisterUser();
  I.fillField('email', faker.internet.email());
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', faker.person.firstName());
  I.fillField('#surname', faker.person.lastName());
  I.click('Support');
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user roles');
  I.uncheckOption('#show-hidden');

  I.fillField('#roles__search-box', 'iud-filter-role-');
  I.wait(2);

  const roleCheckboxes = await I.grabValueFromAll(locate('//div[@class=\'govuk-checkboxes__item\' and not(@hidden)]/input[@name=\'roles\']'));
  roleCheckboxes.forEach(function (checkbox) {
    I.assertStartsWith(checkbox, 'iud-filter-role-');
  });

});
