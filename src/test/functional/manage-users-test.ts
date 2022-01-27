import {config} from '../config';

Feature('User Sign In');

Scenario('I as an system owner should be able to manage the users', ({I}) => {
  I.loginAsSystemOwner();
  I.waitForText('Add new users');
  I.waitForText('Manage existing users');
  I.click('Manage existing users');
  I.click('Continue');
  I.waitForText('Please enter the email address of the user you wish to manage');
}).retry(config.SCENARIO_RETRY_LIMIT);

