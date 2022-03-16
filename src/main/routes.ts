import { Application } from 'express';
import {
  ADD_USER_DETAILS_URL,
  ADD_USERS_URL,
  EDIT_USER_URL,
  USER_DELETE_URL,
  HOME_URL,
  MANAGER_USERS_URL,
  USER_ACTIONS_URL,
  USER_DETAILS_URL,
  USER_SUSPEND_URL
} from './utils/urls';
import { FeatureFlags } from './app/feature-flags/FeatureFlags';
import { BETA_FEATURES } from './app/feature-flags/flags';

export default function(app: Application): void {
  const featureFlags: FeatureFlags = app.locals.container.cradle.featureFlags;

  app.get(HOME_URL, app.locals.container.cradle.userOptionController.get);
  app.post(HOME_URL, app.locals.container.cradle.userOptionController.post);
  app.get(ADD_USERS_URL, featureFlags.toggleRoute(BETA_FEATURES), app.locals.container.cradle.addUsersController.get);
  app.post(ADD_USER_DETAILS_URL, featureFlags.toggleRoute(BETA_FEATURES), app.locals.container.cradle.addUserDetailsController.post);
  app.get(MANAGER_USERS_URL, app.locals.container.cradle.manageUsersController.get);
  app.post(EDIT_USER_URL, featureFlags.toggleRoute(BETA_FEATURES), app.locals.container.cradle.userEditController.post);
  app.post(USER_DETAILS_URL, app.locals.container.cradle.userResultsController.post);
  app.post(USER_ACTIONS_URL, featureFlags.toggleRoute(BETA_FEATURES), app.locals.container.cradle.userActionsController.post);
  app.post(USER_DELETE_URL, app.locals.container.cradle.userDeleteController.post);
  app.post(USER_SUSPEND_URL, app.locals.container.cradle.userSuspendController.post);
}
