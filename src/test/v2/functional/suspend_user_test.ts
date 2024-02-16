Feature('v2_suspend_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin can suspend user',  async ({ I }) => {
  const testUser = await I.haveUser();
  I.navigateToManageUser(testUser.email);
  I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Suspend user'));
  I.click('Suspend user');
  I.seeAfterClick('Are you sure you want to suspend', 'h1');
  I.checkOption('#confirmSuspendRadio');
  I.click('Continue');
  I.seeAfterClick('User suspended successfully', 'h1');
  I.click('Return to user details');
  I.seeAfterClick('User Details', 'h1');
  I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
});

Scenario('I as an admin can cancel suspending a user',  async ({ I }) => {
  const testUser = await I.haveUser();
  I.navigateToManageUser(testUser.email);
  I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Suspend user'));
  I.click('Suspend user');
  I.seeAfterClick('Are you sure you want to suspend', 'h1');
  I.checkOption('#confirmSuspendRadio-2');
  I.click('Continue');
  I.seeAfterClick('User Details', 'h1');
  I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
});

Scenario('I as an admin can unsuspend user',  async ({ I }) => {
  const testUser = await I.haveUser({accountStatus: 'SUSPENDED'});
  I.navigateToManageUser(testUser.email);
  I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Unsuspend user'));
  I.click('Unsuspend user');
  I.seeAfterClick('Are you sure you want to unsuspend', 'h1');
  I.checkOption('#confirmUnSuspendRadio');
  I.click('Continue');
  I.seeAfterClick('User unsuspended successfully', 'h1');
  I.click('Return to user details');
  I.seeAfterClick('User Details', 'h1');
  I.seeIgnoreCase('active', I.locateStrongDataForTitle('Account state'));
});

Scenario('I as an admin can cancel unsuspending a user',  async ({ I }) => {
  const testUser = await I.haveUser({accountStatus: 'SUSPENDED'});
  I.navigateToManageUser(testUser.email);
  I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Unsuspend user'));
  I.click('Unsuspend user');
  I.seeAfterClick('Are you sure you want to unsuspend', 'h1');
  I.checkOption('#confirmUnSuspendRadio-2');
  I.click('Continue');
  I.seeAfterClick('User Details', 'h1');
  I.seeIgnoreCase('suspended', I.locateStrongDataForTitle('Account state'));
});