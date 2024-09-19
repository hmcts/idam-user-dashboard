import { faker } from '@faker-js/faker';

Feature('v2_edit_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin should edit user details successfully',  async ({ I, setupDAO }) => {
  const testUser = await I.haveUser();
  await I.navigateToEditUser(testUser.email);
  await I.seeInField('forename', testUser.forename);
  await I.seeInField('surname', testUser.surname);
  await I.seeInField('email', testUser.email);
  await I.seeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));

  const changedForename = faker.person.firstName();
  const changedSurname = faker.person.lastName();
  const changedEmail = faker.internet.email({firstName : changedForename, lastName : changedSurname, provider: 'test.local'});
  await I.fillField('forename', changedForename);
  await I.fillField('surname', changedSurname);
  await I.fillField('email', changedEmail);
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
  await I.navigateToEditUser(testUser.email);
  await I.seeInField('email', testUser.email);

  await I.uncheckOption('#hide-disabled');
  I.scrollPageToBottom();

  await I.seeCheckboxIsChecked(I.locateInput('roles', testRole.name));
  const testRoleDisabled = await I.grabDisabledElementStatus(I.locateInput('roles', testRole.name));
  I.assertTrue(testRoleDisabled);
  I.dontSeeCheckboxIsChecked(I.locateInput('roles', setupDAO.getWorkerRole().name));

  I.checkOption(I.locateInput('roles', setupDAO.getWorkerRole().name));
  await I.clickToExpectSuccess('Save');
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  I.scrollPageToBottom();

  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.see(setupDAO.getWorkerRole().name, I.locateDataForTitle('Assigned roles'));
  I.dontSeeElement(locate('button').withText('Delete user'));
});

Scenario('I as an admin should see validation errors for invalid values', async ({ I }) => {
  const testUser = await I.haveUser();

  await I.navigateToEditUser(testUser.email);
  await I.fillField('email', 'email..@test.com');
  await I.clickToExpectProblem('Save');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.email);
  await I.fillField('email', '@email@');
  await I.clickToExpectProblem('Save');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.email);
  await I.fillField('email', 'email@com..');
  await I.clickToExpectProblem('Save');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.email);
  I.clearField('forename');
  I.clearField('surname');
  I.clearField('email');
  await I.clickToExpectProblem('Save');
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.email);
  await I.fillField('#forename', ' ');
  await I.fillField('#surname', ' ');
  await I.fillField('#email', ' ');
  await I.clickToExpectProblem('Save');
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  I.see('The email address is not in the correct format');

  await I.navigateToEditUser(testUser.email);
  await I.clickToExpectProblem('Save');
  I.see('No changes to the user were made');

});

Scenario('I as an admin can enable MFA', async ({ I }) => {
  const testUser = await I.haveUser({roleNames: ['idam-mfa-disabled']});
  await I.navigateToEditUser(testUser.email);
  await I.seeInField('email', testUser.email);
  I.retry(9).dontSeeCheckboxIsChecked(locate('input').withAttr({name: 'multiFactorAuthentication'}));

  I.checkOption(locate('input').withAttr({name: 'multiFactorAuthentication'}));
  await I.clickToExpectSuccess('Save');
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.seeIgnoreCase('enabled', I.locateStrongDataForTitle('Multi-factor authentication'));
});

Scenario('I as an admin cannot edit values for SSO users', async ({ I }) => {
  const testUser = await I.haveUser({
    ssoId: faker.string.uuid(),
    ssoProvider: 'azure'
  });
  await I.navigateToEditUser(testUser.email);
  const emailDisabled = await I.grabDisabledElementStatus(locate('input').withAttr({name:'email'}));
  I.assertTrue(emailDisabled);
});

Scenario('I as an admin can filter roles', async ({ I, setupDAO }) => {
  const testRole = await I.haveRole({ name: 'iud-filter-role-' + faker.word.verb() + '-' + faker.word.noun()});
  const adminRole = setupDAO.getAdminRole();
  const testUser = await I.haveUser({roleNames: [testRole.name, adminRole.name]});
  await I.navigateToEditUser(testUser.email);
  await I.seeInField('email', testUser.email);
  await I.uncheckOption('#hide-disabled');

  await I.fillField('#roles__search-box', adminRole.name);
  await tryTo(() => I.waitForVisible(I.locateRoleContainer(adminRole.name), 3));
  await I.retry({ retries: 9, minTimeout: 250 }).seeIsNotHidden(I.locateRoleContainer(adminRole.name));
  
  await I.fillField('#roles__search-box', 'iud-filter-role-');
  await tryTo(() => I.waitForInvisible(I.locateRoleContainer(adminRole.name), 3));
  await I.retry({ retries: 9, minTimeout: 250 }).seeIsHidden(I.locateRoleContainer(adminRole.name));

  await I.retry({ retries: 9, minTimeout: 250 }).seeIsNotHidden(I.locateRoleContainer(testRole.name));
  await I.seeCheckboxIsChecked(I.locateInput('roles', testRole.name));

  const roleCheckboxes = await I.grabValueFromAll(locate('//div[@class=\'govuk-checkboxes__item\' and not(@hidden)]/input[@name=\'roles\']'));
  roleCheckboxes.forEach(function (checkbox) {
    I.assertStartsWith(checkbox, 'iud-filter-role-');
  });

});
