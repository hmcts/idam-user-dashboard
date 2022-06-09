import { Application } from 'express';
import {
  ADD_USER_DETAILS_URL,
  ADD_USER_ROLES_URL,
  ADD_USER_URL,
  EDIT_USER_URL,
  USER_DELETE_URL,
  HOME_URL,
  MANAGER_USER_URL,
  USER_ACTIONS_URL,
  USER_DETAILS_URL,
  USER_SUSPEND_URL,
  ACCESSIBILITY_STATEMENT,
  GENERATE_REPORT_URL,
  DOWNLOAD_REPORT_URL,
  ADD_PRIVATE_BETA_SERVICE_URL,
} from './utils/urls';
import { FeatureFlags } from './app/feature-flags/FeatureFlags';
import {
  BETA_ADD,
  BETA_DELETE,
  BETA_EDIT,
  BETA_SUSPEND,
  BETA_SHOW_LOCKED_STATUS,
  GAMMA_PRIVATE_BETA,
  GAMMA_GENERATE_REPORT
} from './app/feature-flags/flags';

export default function(app: Application): void {
  const featureFlags: FeatureFlags = app.locals.container.cradle.featureFlags;

  app.get(HOME_URL, app.locals.container.cradle.userOptionController.get);
  app.post(HOME_URL, app.locals.container.cradle.userOptionController.post);
  app.get(ADD_USER_URL, featureFlags.toggleRoute(BETA_ADD), app.locals.container.cradle.addUserController.get);
  app.post(ADD_USER_DETAILS_URL, featureFlags.toggleRoute(BETA_ADD), app.locals.container.cradle.addUserDetailsController.post);
  app.post(ADD_USER_ROLES_URL, featureFlags.toggleRoute(BETA_ADD), app.locals.container.cradle.addUserRolesController.post);
  app.post(ADD_PRIVATE_BETA_SERVICE_URL, featureFlags.toggleRoute(BETA_ADD), featureFlags.toggleRoute(GAMMA_PRIVATE_BETA), app.locals.container.cradle.addPrivateBetaServiceController.post);
  app.get(MANAGER_USER_URL, app.locals.container.cradle.manageUserController.get);
  app.post(USER_DETAILS_URL, featureFlags.toggleRoute(BETA_SHOW_LOCKED_STATUS), app.locals.container.cradle.userResultsController.post);
  app.post(USER_ACTIONS_URL, app.locals.container.cradle.userActionsController.post);
  app.post(EDIT_USER_URL, featureFlags.toggleRoute(BETA_EDIT), app.locals.container.cradle.userEditController.post);
  app.post(USER_DELETE_URL, featureFlags.toggleRoute(BETA_DELETE), app.locals.container.cradle.userDeleteController.post);
  app.post(USER_SUSPEND_URL, featureFlags.toggleRoute(BETA_SUSPEND), app.locals.container.cradle.userSuspendController.post);
  app.get(ACCESSIBILITY_STATEMENT, app.locals.container.cradle.accessibilityStatementController.get);
  app.get(GENERATE_REPORT_URL, featureFlags.toggleRoute(GAMMA_GENERATE_REPORT), app.locals.container.cradle.generateReportController.get);
  app.post(GENERATE_REPORT_URL, featureFlags.toggleRoute(GAMMA_GENERATE_REPORT), app.locals.container.cradle.generateReportController.post);
  app.get(DOWNLOAD_REPORT_URL, featureFlags.toggleRoute(GAMMA_GENERATE_REPORT), app.locals.container.cradle.downloadReportController.get);
}
