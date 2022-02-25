import { Application } from 'express';
import { ADD_USER_DETAILS_URL, ADD_USERS_URL, HOME_URL, MANAGER_USERS_URL, USER_RESULTS_URL } from './utils/urls';

export default function(app: Application): void {
  app.get(HOME_URL, app.locals.container.cradle.userOptionController.get);
  app.post(HOME_URL, app.locals.container.cradle.userOptionController.post);
  app.get(ADD_USERS_URL, app.locals.container.cradle.addUsersController.get);
  app.post(ADD_USER_DETAILS_URL, app.locals.container.cradle.addUserDetailsController.post);
  app.get(MANAGER_USERS_URL, app.locals.container.cradle.manageUsersController.get);
  app.post(USER_RESULTS_URL, app.locals.container.cradle.userResultsController.post);
}
