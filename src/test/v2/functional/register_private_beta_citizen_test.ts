import { faker } from '@faker-js/faker';

Feature('v2_register_private_beta');

Before(async ({ setupDAO }) => {

  await setupDAO.setupAdmin();

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
  await I.navigateToRegisterUser();
  I.fillField('email', registerEmail);
  await I.clickToNavigate('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Private Beta Citizen');
  await I.clickToNavigate('Continue', '/user/add/details', 'Add a new user');
  I.see('Please select a service you would want to associate with the private beta citizen');
  I.selectOption('#service', privateBetaService.clientId);
  await I.clickToNavigate('Save', '/user/add/private-beta-service', 'User registered');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  I.assertEqual(invite.email, registerEmail);
  I.assertEqual(invite.invitationType, 'SELF_REGISTER');
  I.assertEqual(invite.invitationStatus, 'PENDING');

});