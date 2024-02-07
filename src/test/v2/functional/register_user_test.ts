import { faker } from '@faker-js/faker';

Feature('v2_view_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin should be able to register support user', async ({ I, setupDAO }) => {

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'test.local'});
  I.navigateToRegisterUser();
  I.fillField('email', registerEmail);
  I.click('Continue');
  I.seeAfterClick('Add new user details', 'h1');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Support');
  I.click('Continue');
  I.seeAfterClick('Add new user roles', locate('h1'));
  I.wait(3);
  I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name));
  I.click('Save');
  I.seeAfterClick('User registered', 'h1');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  I.assertEqual(invite.email, registerEmail);
  I.assertEqual(invite.invitationType, 'SELF_REGISTER');
  I.assertEqual(invite.invitationStatus, 'PENDING');

});

Scenario('I as an admin should be able to register professional user', async ({ I, setupDAO }) => {

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'test.local'});
  I.navigateToRegisterUser();
  I.fillField('email', registerEmail);
  I.click('Continue');
  I.seeAfterClick('Add new user details', 'h1');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Professional');
  I.click('Continue');
  I.seeAfterClick('Add new user roles', locate('h1'));
  I.wait(3);
  I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name));
  I.click('Save');
  I.seeAfterClick('User registered', 'h1');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  I.assertEqual(invite.email, registerEmail);
  I.assertEqual(invite.invitationType, 'SELF_REGISTER');
  I.assertEqual(invite.invitationStatus, 'PENDING');

});

Scenario('I as an admin should be able to register private beta citizen', async ({ I, setupDAO }) => {
  const privateBetaRole = await I.have('role');
  const privateBetaService = await I.have('service', {onboardingRoleNames: [privateBetaRole.name]});

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'test.local'});
  I.navigateToRegisterUser();
  I.fillField('email', registerEmail);
  I.click('Continue');
  I.seeAfterClick('Add new user details', 'h1');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Private Beta Citizen');
  I.click('Continue');
  pause();
  I.seeAfterClick('Add new user roles', locate('h1'));
  I.wait(3);
  I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name));
  I.click('Save');
  I.seeAfterClick('User registered', 'h1');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  I.assertEqual(invite.email, registerEmail);
  I.assertEqual(invite.invitationType, 'SELF_REGISTER');
  I.assertEqual(invite.invitationStatus, 'PENDING');

});

Scenario('I as an admin should see validation errors for invalid values', async ({ I }) => {
  I.navigateToRegisterUser();
  I.fillField('email', 'email..@test.com');
  I.click('Continue');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('The email address is not in the correct format');
  
  I.navigateToRegisterUser();
  I.fillField('email', '@email@');
  I.click('Continue');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('The email address is not in the correct format');
  
  I.navigateToRegisterUser();
  I.fillField('email', 'email@com..');
  I.click('Continue');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('The email address is not in the correct format');
  
  I.navigateToRegisterUser();
  I.fillField('email', '');
  I.click('Continue');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('You must enter an email address');

  I.navigateToRegisterUser();
  I.fillField('email', ' ');
  I.click('Continue');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('You must enter an email address');

  I.navigateToRegisterUser();
  I.fillField('email', codeceptjs.container.support('adminIdentity').email);
  I.click('Continue');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('The email \'' + codeceptjs.container.support('adminIdentity').email + '\' already exists');

  I.navigateToRegisterUser();
  I.fillField('email', faker.internet.email());
  I.click('Continue');
  I.seeAfterClick('Add new user details', 'h1');
  I.clearField('forename');
  I.clearField('surname');
  I.click('Continue');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  
  I.navigateToRegisterUser();
  I.fillField('email', faker.internet.email());
  I.click('Continue');
  I.seeAfterClick('Add new user details', 'h1');
  I.fillField('#forename', ' ');
  I.fillField('#surname', ' ');
  I.click('Continue');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  
  I.navigateToRegisterUser();
  I.fillField('email', faker.internet.email());
  I.click('Continue');
  I.seeAfterClick('Add new user details', 'h1');
  I.fillField('#forename', faker.person.firstName());
  I.fillField('#surname', faker.person.lastName());
  I.click('Support');
  I.click('Continue');
  I.seeAfterClick('Add new user roles', locate('h1'));
  I.click('Save');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('A user must have at least one role assigned to be able to create them');
});