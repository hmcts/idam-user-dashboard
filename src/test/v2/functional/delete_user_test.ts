Feature('v2_delete_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin can delete user successfully',  async ({ I }) => {
  const testUser = await I.haveUser();
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Delete user'));
  I.click('Delete user');
  I.seeAfterClick('Are you sure you want to delete', 'h1');
  I.checkOption('#confirmRadio');
  I.click('Continue');
  I.seeAfterClick('User deleted successfully', 'h1');
  I.click('Return to main menu');
  I.seeAfterClick('What do you want to do?', 'h1');
  I.checkOption('Manage an existing user');
  I.click('Continue');
  I.seeInCurrentUrl('/user/manage');
  I.seeAfterClick('Search for an existing user', 'h1');
  I.fillField('search', testUser.email);
  I.click('Search');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('No user matches your search for: ' + testUser.email);
});

Scenario('I as an admin cannot delete user with unmanageable roles',  async ({ I, setupDAO }) => {
  const testRole = await I.haveRole();
  const testUser = await I.haveUser({roleNames: [testRole.name, setupDAO.getWorkerRole().name]});
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.dontSeeElement(locate('button').withText('Delete user'));
});

Scenario('I as an admin can delete archived user successfully',  async ({ I }) => {
  const testUser = await I.haveUser({recordType: 'ARCHIVED'});
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeIgnoreCase('archived', I.locateStrongDataForTitle('Account state'));
  I.seeElement(locate('button').withText('Delete user'));
  I.click('Delete user');
  I.seeAfterClick('Are you sure you want to delete', 'h1');
  I.checkOption('#confirmRadio');
  I.click('Continue');
  I.seeAfterClick('User deleted successfully', 'h1');
  I.click('Return to main menu');
  I.seeAfterClick('What do you want to do?', 'h1');
  I.checkOption('Manage an existing user');
  I.click('Continue');
  I.seeInCurrentUrl('/user/manage');
  I.seeAfterClick('Search for an existing user', 'h1');
  I.fillField('search', testUser.email);
  I.click('Search');
  I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
  I.see('No user matches your search for: ' + testUser.email);
});

Scenario('I as an admin can cancel deleting a user',  async ({ I }) => {
  const testUser = await I.haveUser();
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Delete user'));
  I.click('Delete user');
  I.seeAfterClick('Are you sure you want to delete', 'h1');
  I.checkOption('#confirmRadio-2');
  I.click('Continue');
  I.seeAfterClick('User Details', 'h1');
  I.see(testUser.email, I.locateDataForTitle('Email'));
});