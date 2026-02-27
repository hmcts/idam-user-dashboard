import { faker } from '@faker-js/faker';
import { BuildInfoHelper } from '../common/build_info';

Feature('v2_register_private_beta');

Before(async ({ setupDAO }) => {

  await setupDAO.setupAdmin();

});

Scenario('I as an admin should be able to register private beta citizen', async ({ I, setupDAO }) => {
  const privateBetaRole = await I.haveRole();
  const privateBetaService = await I.haveService({onboardingRoleNames: [privateBetaRole.name]});
  const privateBetaAdminRole = await I.haveRole({assignableRoleNames: ['citizen', privateBetaRole.name]});

  const betaAdmin = await I.haveUser({
    roleNames: [privateBetaAdminRole.name, 'idam-user-dashboard--access']
  });
  await I.loginAs(betaAdmin.email, betaAdmin.password);

  const registerForename = faker.person.firstName();
  const registerSurname = faker.person.lastName();
  const registerEmail = faker.internet.email({firstName : registerForename, lastName : registerSurname, provider: 'iud.register.' + BuildInfoHelper.getBuildInfo() + '.local'});
  await I.goToRegisterUser();
  I.fillField('email', registerEmail);
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add new user details');
  I.fillField('#forename', registerForename);
  I.fillField('#surname', registerSurname);
  I.click('Private Beta Citizen');
  await I.clickToNavigateWithNoRetry('Continue', '/user/add/details', 'Add a new user');
  I.see('Please select a service you would want to associate with the private beta citizen');
  I.selectOption('#service', privateBetaService.clientId);
  await I.clickToNavigateWithNoRetry('Save', '/user/add/private-beta-service', 'User registered');

  const testingToken = await setupDAO.getToken();
  const invite = await I.getSingleInvite(registerEmail, testingToken);
  await I.assertEqual(invite.email, registerEmail);
  await I.assertEqual(invite.invitationType, 'INVITE');
  await I.assertEqual(invite.invitationStatus, 'PENDING');

});
