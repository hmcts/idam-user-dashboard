import { faker } from '@faker-js/faker';
import { tryTo, retryTo } from 'codeceptjs/effects';
import { BuildInfoHelper } from '../common/build_info';
 
Feature('v2_edit_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  await login('admin');

});

Scenario('I as an admin should edit user details successfully',  async ({ I, setupDAO }) => {
  const testUser = await I.haveUser();
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('forename', testUser.forename);
  await I.seeInField('surname', testUser.surname);
  await I.seeInField('email', testUser.email);
  await I.seeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));

  const changedForename = faker.person.firstName();
  const changedSurname = faker.person.lastName();
  const changedEmail = faker.internet.email({firstName : changedForename, lastName : changedSurname, provider: 'iud.changed.' + BuildInfoHelper.getBuildInfo() + '.local'});
  I.fillField('forename', changedForename);
  I.fillField('surname', changedSurname);
  I.fillField('email', changedEmail);
  await I.clickToExpectSuccess('Save');
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  await I.seeInField('forename', changedForename);
  await I.seeInField('surname', changedSurname);
  await I.seeInField('email', changedEmail);
  await I.seeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));

  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.scrollPageToBottom();
  I.seeElement(locate('button').withText('Suspend user'));
  I.seeElement(locate('button').withText('Delete user'));
});

Scenario('I as an admin can only edit roles if I can manage them', async ({ I, setupDAO }) => {
  const testRole = await I.haveRole();
  const testUser = await I.haveUser({roleNames: [testRole.name]});
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('email', testUser.email);

  await I.uncheckOption('#hide-disabled');
  I.scrollPageToBottom();

  await I.seeCheckboxIsChecked(I.locateInput('roles', testRole.name));
  const testRoleDisabled = await I.grabDisabledElementStatus(I.locateInput('roles', testRole.name));
  I.assertTrue(testRoleDisabled);
  await I.dontSeeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));

  I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name));
  await I.seeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));
  await I.clickToExpectSuccess('Save');
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  I.scrollPageToBottom();

  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.see(setupDAO.getWorkerRole().name, I.locateDataForTitle('Assigned roles'));
  I.dontSeeElement(locate('button').withText('Delete user'));
});

Scenario('I as an admin should see validation errors for invalid values', async ({ I }) => {
  const testUser = await I.haveUser();

  await I.navigateToEditUser(testUser.id);
  I.fillField('email', 'email..@test.com');
  await I.clickToExpectProblem('Save');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.id);
  I.fillField('email', '@email@');
  await I.clickToExpectProblem('Save');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.id);
  I.fillField('email', 'email@com..');
  await I.clickToExpectProblem('Save');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.id);
  I.clearField('forename');
  I.clearField('surname');
  I.clearField('email');
  await I.clickToExpectProblem('Save');
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.id);
  I.fillField('#forename', ' ');
  I.fillField('#surname', ' ');
  I.fillField('#email', ' ');
  await I.clickToExpectProblem('Save');
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.id);
  await I.clickToExpectProblem('Save');
  I.see('No changes to the user were made');

});

Scenario('I as an admin can enable MFA', async ({ I, setupDAO }) => {
  const testUser = await I.haveUser({roleNames: ['idam-mfa-disabled', setupDAO.getWorkerRole().name]});
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('email', testUser.email);
  await retryTo(() => I.dontSeeCheckboxIsChecked(locate('input').withAttr({name: 'multiFactorAuthentication'})), 9);

  I.checkOption(locate('input').withAttr({name: 'multiFactorAuthentication'}));
  await retryTo(() => I.seeCheckboxIsChecked(locate('input').withAttr({name: 'multiFactorAuthentication'})), 9);

  await I.clickToExpectSuccess('Save');
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  await I.seeIgnoreCase('enabled', I.locateStrongDataForTitle('Multi-factor authentication'));
});

Scenario('I as an admin cannot edit values for SSO users', async ({ I }) => {
  const testUser = await I.haveUser({
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });
  await I.navigateToEditUser(testUser.id);
  const emailDisabled = await I.grabDisabledElementStatus(locate('input').withAttr({name:'email'}));
  I.assertTrue(emailDisabled);
});

Scenario('I as an admin can filter roles', async ({ I, setupDAO }) => {
  const testRole = await I.haveRole({ name: 'iud-filter-role-' + faker.word.verb() + '-' + faker.word.noun()});
  const adminRole = setupDAO.getAdminRole();
  const testUser = await I.haveUser({roleNames: [testRole.name, adminRole.name]});
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('email', testUser.email);
  await I.uncheckOption('#hide-disabled');

  I.fillField('#roles__search-box', adminRole.name);
  await tryTo(() => I.waitForVisible(I.locateRoleContainer(adminRole.name), 3));
  await retryTo(() => I.seeIsNotHidden(I.locateRoleContainer(adminRole.name)), 9);
  
  I.fillField('#roles__search-box', 'iud-filter-role-');
  await tryTo(() => I.waitForInvisible(I.locateRoleContainer(adminRole.name), 3));
  await retryTo(() => I.seeIsHidden(I.locateRoleContainer(adminRole.name)), 9);

  await tryTo(() => I.waitForVisible(I.locateRoleContainer(testRole.name), 3));
  const numVisible = await I.grabNumberOfVisibleElements(I.locateRoleContainer(testRole.name));
  if (numVisible == 0) {
    I.say('filter not working, trying again');
    I.clearField('#roles__search-box');
    I.fillField('#roles__search-box', 'iud-filter-role-');
    I.wait(3);
    I.scrollPageToBottom();
  }
  await retryTo(() => I.seeIsNotHidden(I.locateRoleContainer(testRole.name)), 9);
  await I.seeCheckboxIsChecked(I.locateInput('roles', testRole.name));

  const roleCheckboxes = await I.grabValueFromAll(locate('//div[@class=\'govuk-checkboxes__item\' and not(@hidden)]/input[@name=\'roles\']'));
  roleCheckboxes.forEach(function (checkbox) {
    I.assertStartsWith(checkbox, 'iud-filter-role-');
  });

});

Scenario('I as an admin can add a filtered role and existing roles are unchanged', async ({ I, setupDAO }) => {
  const testRole = await I.haveRole({ name: 'iud-user-role-' + faker.word.verb() + '-' + faker.word.noun()});
  const workerRole = setupDAO.getWorkerRole();
  const testUser = await I.haveUser({roleNames: [testRole.name]});
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('email', testUser.email);
  await I.uncheckOption('#hide-disabled');

  I.fillField('#roles__search-box', workerRole.name);
  await tryTo(() => I.waitForVisible(I.locateRoleContainer(workerRole.name), 3));
  await retryTo(() => I.seeIsNotHidden(I.locateRoleContainer(workerRole.name)), 9);
  
  await tryTo(() => I.waitForVisible(I.locateRoleContainer(workerRole.name), 3));
  const numVisible = await I.grabNumberOfVisibleElements(I.locateRoleContainer(workerRole.name));
  if (numVisible == 0) {
    I.say('filter not working, trying again');
    I.clearField('#roles__search-box');
    I.fillField('#roles__search-box', workerRole.name);
    I.wait(3);
    I.scrollPageToBottom();
  }
  await retryTo(() => I.seeIsNotHidden(I.locateRoleContainer(workerRole.name)), 9);

  I.checkOption(I.locateInput('roles', workerRole.name));
  await I.seeCheckboxIsChecked(I.locateInput('roles', workerRole.name));
  await I.clickToExpectSuccess('Save');
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  I.scrollPageToBottom();

  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.see(testRole.name, I.locateDataForTitle('Assigned roles'));
  I.see(workerRole.name, I.locateDataForTitle('Assigned roles'));

});


Scenario('I as an admin cannot edit the citizen attribute', async ({ I, setupDAO }) => {
  const testUser = await I.haveUser({roleNames: [setupDAO.getWorkerRole().name, 'citizen']});
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('email', testUser.email);

  await I.uncheckOption('#hide-disabled');
  I.scrollPageToBottom();

  I.see('Citizen role', 'legend');
  await I.seeCheckboxIsChecked('isCitizen');
  const citizenRoleDisabled = await I.grabDisabledElementStatus(locate('input').withAttr({name:'isCitizen'}));
  I.assertTrue(citizenRoleDisabled);
});

Scenario('I as an admin can remove the citizen attribute if there is a caseworker conflict', async ({ I }) => {
  const testUser = await I.haveUser({
    roleNames: ['caseworker', 'citizen'],
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('email', testUser.email);

  await I.uncheckOption('#hide-disabled');
  I.scrollPageToBottom();

  I.see('Citizen role', 'legend');
  I.see('This user should probably not be a citizen.', locate('div.govuk-warning-text'));
  await I.seeCheckboxIsChecked('isCitizen');
  const citizenRoleDisabled = await I.grabDisabledElementStatus(locate('input').withAttr({name:'isCitizen'}));
  I.assertFalse(citizenRoleDisabled);

  I.uncheckOption(locate('input').withAttr({name: 'isCitizen'}));
  await retryTo(() => I.dontSeeCheckboxIsChecked(locate('input').withAttr({name: 'isCitizen'})), 9);

  await I.clickToExpectSuccess('Save');
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.dontSee('citizen', I.locateDataForTitle('Assigned roles'));

  await I.navigateToEditUser(testUser.id);
  await I.seeInField('email', testUser.email);

  I.dontSee('Citizen role', 'legend');

});

Scenario('I as an admin cannot change a user email if there is a conflict',  async ({ I, setupDAO }) => {
  const conflictUser = await I.haveUser();
  const testUser = await I.haveUser();
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('forename', testUser.forename);
  await I.seeInField('surname', testUser.surname);
  await I.seeInField('email', testUser.email);
  await I.seeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));

  I.fillField('email', conflictUser.email);
  await I.clickToExpectProblem('Save');
  
  I.see('A user with this email address already exists');
});

Scenario('I as an admin cannot change a user email if the account is archived',  async ({ I, setupDAO }) => {
  const testUser = await I.haveUser();
  await I.navigateToEditUser(testUser.id);
  await I.seeInField('forename', testUser.forename);
  await I.seeInField('surname', testUser.surname);
  await I.seeInField('email', testUser.email);
  await I.seeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));

  const testToken = await setupDAO.getToken();
  await I.archiveExistingTestUser(testUser, testToken);

  const changedEmail = faker.internet.email({firstName : testUser.forename, lastName : testUser.surname, provider: 'iud.changed.' + BuildInfoHelper.getBuildInfo() + '.local'});

  I.fillField('email', changedEmail);
  await I.clickToExpectProblem('Save');
  I.see('Cannot update archived user');
});
