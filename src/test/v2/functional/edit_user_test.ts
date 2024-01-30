import { faker } from '@faker-js/faker';

Feature('v2_edit_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin should edit user details successfully',  async ({ I, setupDAO }) => {
  const testUser = await I.have('user');
  I.navigateToEditUser(testUser.email);
  I.seeInField('forename', testUser.forename);
  I.seeInField('surname', testUser.surname);
  I.seeInField('email', testUser.email);
  I.seeCheckboxIsChecked(locate('input').withAttr({name: 'roles', value: setupDAO.getWorkerRole().name}));

  const changedForename = faker.person.firstName();
  const changedSurname = faker.person.lastName();
  const changedEmail = faker.internet.email({firstName : changedForename, lastName : changedSurname, provider: 'test.local'})
  I.fillField('forename', changedForename);
  I.fillField('surname', changedSurname);
  I.fillField('email', changedEmail);
  I.click('Save');
  I.seeAfterClick('Success', locate('h2.govuk-notification-banner__title'));
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  I.seeInField('forename', changedForename);
  I.seeInField('surname', changedSurname);
  I.seeInField('email', changedEmail);
  I.seeCheckboxIsChecked(locate('input').withAttr({name: 'roles', value: setupDAO.getWorkerRole().name}));
});

Scenario('I as an admin can only edit roles if I can manage them', async ({ I, setupDAO }) => {
  const testRole = await I.have('role');
  const testUser = await I.have('user', {roleNames: [testRole.name]});
  I.navigateToEditUser(testUser.email);
  I.seeInField('email', testUser.email);
  I.seeCheckboxIsChecked(locate('input').withAttr({name: 'roles', value: testRole.name}));
  const testRoleDisabled = await I.grabDisabledElementStatus(locate('input').withAttr({name: 'roles', value: testRole.name}));
  I.assertTrue(testRoleDisabled);
  I.dontSeeCheckboxIsChecked(locate('input').withAttr({name: 'roles', value: setupDAO.getWorkerRole().name}));
  
  I.checkOption(locate('input').withAttr({name: 'roles', value: setupDAO.getWorkerRole().name}));
  I.click('Save');
  I.seeAfterClick('Success', locate('h2.govuk-notification-banner__title'));
  I.see('User details updated successfully', locate('h3.govuk-notification-banner__heading'));

  I.click('Return to user details');
  I.seeAfterClick('User Details', 'h1');
  I.see(setupDAO.getWorkerRole().name, locate('dd').after(locate('dt').withText('Assigned roles')));
});


Scenario('I as an admin should see validation errors for invalid values', async ({ I }) => {
  const testUser = await I.have('user');

  I.navigateToEditUser(testUser.email);
  I.fillField('email', 'email..@test.com');
  I.click('Save');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('The email address is not in the correct format');

  I.navigateToEditUser(testUser.email);
  I.fillField('email', '@email@');
  I.click('Save');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('The email address is not in the correct format');

  I.navigateToEditUser(testUser.email);
  I.fillField('email', 'email@com..');
  I.click('Save');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('The email address is not in the correct format');

  I.navigateToEditUser(testUser.email);
  I.clearField('forename');
  I.clearField('surname');
  I.clearField('email');
  I.click('Save');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  I.see('The email address is not in the correct format');

  I.navigateToEditUser(testUser.email);
  I.fillField('#forename', ' ');
  I.fillField('#surname', ' ');
  I.fillField('#email', ' ');
  I.click('Save');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('You must enter a forename for the user');
  I.see('You must enter a surname for the user');
  I.see('The email address is not in the correct format');

  I.navigateToEditUser(testUser.email);
  I.click('Save');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('No changes to the user were made');

});
