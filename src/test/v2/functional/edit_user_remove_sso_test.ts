// import { faker } from '@faker-js/faker';

// Feature('v2_edit_user_remove_sso');

// Before(async ({ setupDAO, login }) => {

//   await setupDAO.setupAdmin();
//   login('admin');

// });

// Scenario('I as an admin can remove SSO successfully',  async ({ I }) => {
//   const testUser = await I.have('user', {
//     ssoId: faker.string.uuid(),
//     ssoProvider: 'azure'
//   });

//   I.navigateToManageUser(testUser.email);
//   I.see(testUser.email, I.locateDataForTitle('Email'));
//   I.see('eJudiciary.net', I.locateDataForTitle('Identity Provider'));
//   I.see(testUser.ssoId, I.locateDataForTitle('eJudiciary User ID'));

//   I.see('Remove SSO');
//   I.click('Remove SSO');
//   I.seeAfterClick('Are you sure you want to remove single sign-on', 'h1');
//   I.checkOption('#confirmRadio');
//   I.click('Continue');
//   I.seeAfterClick('Single sign-on removed successfully', 'h1');

//   I.click('Return to user details');
//   I.seeAfterClick('User Details', 'h1');
//   I.see(testUser.email, I.locateDataForTitle('Email'));
//   I.see('IDAM', I.locateDataForTitle('Identity Provider'));
//   I.dontSeeElement(I.locateTitle('IdP User ID'));
// });

// Scenario('I as an admin can cancel removing SSO',  async ({ I }) => {
//   const testUser = await I.have('user', {
//     ssoId: faker.string.uuid(),
//     ssoProvider: 'azure'
//   });

//   I.navigateToManageUser(testUser.email);
//   I.see(testUser.email, I.locateDataForTitle('Email'));
//   I.see('eJudiciary.net', I.locateDataForTitle('Identity Provider'));
//   I.see(testUser.ssoId, I.locateDataForTitle('eJudiciary User ID'));

//   I.see('Remove SSO');
//   I.click('Remove SSO');
//   I.seeAfterClick('Are you sure you want to remove single sign-on', 'h1');
//   I.checkOption('#confirmRadio-2');
//   I.click('Continue');
//   I.seeAfterClick('User Details', 'h1');
//   I.see(testUser.email, I.locateDataForTitle('Email'));
//   I.see('eJudiciary.net', I.locateDataForTitle('Identity Provider'));
//   I.see(testUser.ssoId, I.locateDataForTitle('eJudiciary User ID'));

// });