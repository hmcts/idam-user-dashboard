Feature('v2_delete_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  await login('admin');

});

Scenario('I as an admin can delete user successfully',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Delete user'));
  await I.clickToNavigate('Delete user', '/user/delete', 'Are you sure you want to delet');
  I.checkOption('#confirmRadio');
  await I.clickToNavigate('Continue', '/user/delete', 'User deleted successfully');
  I.click('Return to main menu');
  I.seeAfterClick('What do you want to do?', 'h1');
  I.checkOption('Manage an existing user');
  await I.clickToNavigate('Continue', '/user/manage', 'Search for an existing user');
  I.fillField('search', testUser.email);
  await I.clickToExpectProblem('Search');
  I.see('No user matches your search for: ' + testUser.email);
});

Scenario('I as an admin cannot delete user with unmanageable roles',  async ({ I, setupDAO }) => {
  const testRole = await I.haveRole();
  const testUser = await I.haveUser({roleNames: [testRole.name, setupDAO.getWorkerRole().name]});
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.dontSeeElement(locate('button').withText('Delete user'));
});

Scenario('I as an admin can delete archived user successfully',  async ({ I }) => {
  const testUser = await I.haveUser({recordType: 'ARCHIVED'});
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  await I.seeIgnoreCase('archived', I.locateStrongDataForTitle('Account state'));
  I.seeElement(locate('button').withText('Delete user'));
  await I.clickToNavigate('Delete user', '/user/delete', 'Are you sure you want to delet');
  I.checkOption('#confirmRadio');
  await I.clickToNavigate('Continue', '/user/delete', 'User deleted successfully');
  I.click('Return to main menu');
  I.seeAfterClick('What do you want to do?', 'h1');
  I.checkOption('Manage an existing user');
  await I.clickToNavigate('Continue', '/user/manage', 'Search for an existing user');
  I.fillField('search', testUser.email);
  await I.clickToExpectProblem('Search');
  I.see('No user matches your search for: ' + testUser.email);
});

Scenario('I as an admin can cancel deleting a user',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.goToManageUser(testUser.id);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Delete user'));
  await I.clickToNavigate('Delete user', '/user/delete', 'Are you sure you want to delet');
  I.checkOption('#confirmRadio-2');
  await I.clickToNavigate('Continue', '/details', 'User Details');
  I.see(testUser.email, I.locateDataForTitle('Email'));
});