import { Application } from 'express';
import { ADD_USERS_URL, HOME_URL, MANAGER_USERS_URL, USER_RESULTS_URL } from './utils/urls';

export default function(app: Application): void {
  app.get(HOME_URL, app.locals.container.cradle.userOptionController.get);
  app.post(HOME_URL, app.locals.container.cradle.userOptionController.post);
  app.get(ADD_USERS_URL, app.locals.container.cradle.addUsersController.get);
  app.get(MANAGER_USERS_URL, app.locals.container.cradle.manageUsersController.get);
  app.get(USER_RESULTS_URL, app.locals.container.cradle.userResultsController.get);
}
