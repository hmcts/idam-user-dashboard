//import axeTest from '../../a11y/accessibilityTestHelper';
//import { expect, Page } from "@playwright/test";

const { AxeBuilder } = require('@axe-core/playwright');

Feature('v2_delete_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin can delete user successfully',  async ({ I }) => {
  const testUser = await I.have('user');
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.seeElement(locate('button').withText('Delete user'));

  //const page = I.usePlaywright().page;
  //await axeTest(page);

  const accessibilityViolations = I.executeScript(async () => {

   
    const axeBuilder = AxeBuilder({});

    
    const results = await axeBuilder.analyze();

    
    return results.violations;
  });

  console.error('Accessibility violations:', accessibilityViolations);
  


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
  I.see('No user matches your search for: ' + testUser.email);
});

Scenario('I as an admin cannot delete user with unmanageable roles',  async ({ I, setupDAO }) => {
  const testRole = await I.have('role');
  const testUser = await I.have('user', {roleNames: [testRole.name, setupDAO.getWorkerRole().name]});
  I.navigateToManageUser(testUser.email);
  I.see(testUser.email, I.locateDataForTitle('Email'));
  I.dontSeeElement(locate('button').withText('Delete user'));
});

