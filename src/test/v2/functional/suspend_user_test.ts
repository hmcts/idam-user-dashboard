Feature('v2_suspend_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin can suspend user',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.navigateToManageUser(testUser.email);
  I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Suspend user'));
  await I.click('Suspend user');
  I.seeAfterClick('Are you sure you want to suspend', 'h1');
  await I.checkOption('#confirmSuspendRadio');
  await I.click('Continue');
  I.seeAfterClick('User suspended successfully', 'h1');
  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.seeAfterClick('User Details', 'h1');
  I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
});

Scenario('I as an admin can cancel suspending a user',  async ({ I }) => {
  const testUser = await I.haveUser();
  await I.navigateToManageUser(testUser.email);
  I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Suspend user'));
  await I.click('Suspend user');
  I.seeAfterClick('Are you sure you want to suspend', 'h1');
  await I.checkOption('#confirmSuspendRadio-2');
  await I.clickToNavigate('Continue', '/details', 'User Details');
  I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
});

Scenario('I as an admin can unsuspend user',  async ({ I }) => {
  const testUser = await I.haveUser({accountStatus: 'SUSPENDED'});
  await I.navigateToManageUser(testUser.email);
  I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Unsuspend user'));
  await I.click('Unsuspend user');
  I.seeAfterClick('Are you sure you want to unsuspend', 'h1');
  await I.checkOption('#confirmUnSuspendRadio');
  await I.click('Continue');
  I.seeAfterClick('User unsuspended successfully', 'h1');
  await I.clickToNavigate('Return to user details', '/details', 'User Details');
  I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
});

Scenario('I as an admin can cancel unsuspending a user',  async ({ I }) => {
  const testUser = await I.haveUser({accountStatus: 'SUSPENDED'});
  await I.navigateToManageUser(testUser.email);
  I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Unsuspend user'));
  await I.click('Unsuspend user');
  I.seeAfterClick('Are you sure you want to unsuspend', 'h1');
  await I.checkOption('#confirmUnSuspendRadio-2');
  await I.clickToNavigate('Continue', '/details', 'User Details');
  I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
});