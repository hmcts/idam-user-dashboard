import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { Application } from 'express';
import { UserOptionController } from '../../controllers/UserOptionController';
import { AddUsersController } from '../../controllers/AddUsersController';
import { AddUserDetailsController } from '../../controllers/AddUserDetailsController';
import { ManageUsersController } from '../../controllers/ManageUsersController';
import { UserResultsController } from '../../controllers/UserResultsController';
import { FeatureFlags } from '../../app/feature-flags/FeatureFlags';
import { LaunchDarkly } from '../../app/feature-flags/LaunchDarklyClient';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('app');
import { defaultClient } from 'applicationinsights';

/**
 * Sets up the dependency injection container
 */
export class Container {

  public enableFor(app: Application): void {
    app.locals.container = createContainer({ injectionMode: InjectionMode.CLASSIC }).register({
      logger: asValue(logger),
      telemetryClient: asValue(defaultClient),
      exposeErrors: asValue(app.locals.env === 'development'),
      featureFlags: asValue(new FeatureFlags(new LaunchDarkly())),
      userOptionController: asClass(UserOptionController),
      addUsersController: asClass(AddUsersController),
      addUserDetailsController: asClass(AddUserDetailsController),
      manageUsersController: asClass(ManageUsersController),
      userResultsController: asClass(UserResultsController),
    });
  }
}
