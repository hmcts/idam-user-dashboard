import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { Application } from 'express';
import { UserOptionController } from '../../controllers/UserOptionController';
import { AddUsersController } from '../../controllers/AddUsersController';
import { AddUserDetailsController } from '../../controllers/AddUserDetailsController';
import { ManageUsersController } from '../../controllers/ManageUsersController';
import { UserResultsController } from '../../controllers/UserResultsController';
import { UserActionsController } from '../../controllers/UserActionsController';
import { FeatureFlags } from '../../app/feature-flags/FeatureFlags';
import { LaunchDarkly } from '../../app/feature-flags/LaunchDarklyClient';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('app');
import { defaultClient } from 'applicationinsights';
import { IdamAuth } from '../../app/idam-auth/IdamAuth';
import config from 'config';
import { UserDeleteController } from '../../controllers/UserDeleteController';

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
      userActionsController: asClass(UserActionsController),
      userDeleteController: asClass(UserDeleteController)
    });

    /**
     * Function runs on container creation, gets system user token
     * and creates new axios instance for use within DI.
     * Refreshes token every 10mins if refresh failed, otherwise refreshes
     * on half life of access token.
     */
    (function refreshSystemUser(): void {
      const idamAuth = new IdamAuth(logger, defaultClient);
      const { username, password } = config.get('services.idam.systemUser');
      let delay = 10 * 60;

      idamAuth.authorizePassword(username, password)
        .then(({ tokens }) => {
          app.locals.container.register({
            systemAxios: asValue(idamAuth.getUserAxios(tokens.accessToken))
          });

          delay = tokens.accessToken.expires_in/2;
          logger.info('Refreshed system user token. Refreshing again in: ' + delay/60 + 'mins');
        })
        .catch(() => logger.info('Failed to refresh system user token. Refreshing again in: ' + delay/60 + 'mins'))
        .finally(() => setTimeout(refreshSystemUser, delay * 1000));
    })();
  }
}
