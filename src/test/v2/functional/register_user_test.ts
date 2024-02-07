import { faker } from '@faker-js/faker';

Feature('v2_view_user');

Before(async ({ setupDAO, login }) => {

  await setupDAO.setupAdmin();
  login('admin');

});

Scenario('I as an admin should see validation errors for invalid values', async ({ I }) => {
  
    I.navigateToRegisterUser();
    I.fillField('email', 'email..@test.com');
    I.click('Continue');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('The email address is not in the correct format');
  
    I.navigateToRegisterUser();
    I.fillField('email', '@email@');
    I.click('Continue');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('The email address is not in the correct format');
  
    I.navigateToRegisterUser();
    I.fillField('email', 'email@com..');
    I.click('Continue');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('The email address is not in the correct format');
  
    I.navigateToRegisterUser();
    I.fillField('email', '');
    I.click('Continue');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('You must enter an email address');

    I.navigateToRegisterUser();
    I.fillField('email', ' ');
    I.click('Continue');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('You must enter an email address');

    I.navigateToRegisterUser();
    I.fillField('email', codeceptjs.container.support('adminIdentity').email);
    I.click('Continue');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('The email \'' + codeceptjs.container.support('adminIdentity').email + '\' already exists');

    I.navigateToRegisterUser();
    I.fillField('email', faker.internet.email());
    I.click('Continue');
    I.seeAfterClick('Add new user details', 'h1');
    I.clearField('forename');
    I.clearField('surname');
    I.click('Continue');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('You must enter a forename for the user');
    I.see('You must enter a surname for the user');
  
    I.navigateToRegisterUser();
    I.fillField('email', faker.internet.email());
    I.click('Continue');
    I.seeAfterClick('Add new user details', 'h1');
    I.fillField('#forename', ' ');
    I.fillField('#surname', ' ');
    I.click('Continue');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('You must enter a forename for the user');
    I.see('You must enter a surname for the user');
  
    I.navigateToRegisterUser();
    I.fillField('email', faker.internet.email());
    I.click('Continue');
    I.seeAfterClick('Add new user details', 'h1');
    I.fillField('#forename', faker.person.firstName());
    I.fillField('#surname', faker.person.lastName());
    I.click('Support');
    I.click('Continue');
    I.seeAfterClick('Add new user roles', locate('h1'));
    I.click('Save');
    I.seeAfterClick('There is a problem', locate('h2.govuk-error-summary__title'));
    I.see('A user must have at least one role assigned to be able to create them');
  
  });