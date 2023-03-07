import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { Application } from 'express';
import { UserOptionController } from '../../controllers/UserOptionController';
import { AddUserController } from '../../controllers/AddUserController';
import { AddUserDetailsController } from '../../controllers/AddUserDetailsController';
import { AddUserRolesController } from '../../controllers/AddUserRolesController';
import { ManageUserController } from '../../controllers/ManageUserController';
import { UserResultsController } from '../../controllers/UserResultsController';
import { UserActionsController } from '../../controllers/UserActionsController';
import { UserDeleteController } from '../../controllers/UserDeleteController';
import { UserSuspendController } from '../../controllers/UserSuspendController';
import { FeatureFlags } from '../../app/feature-flags/FeatureFlags';
import { LaunchDarkly } from '../../app/feature-flags/LaunchDarklyClient';
const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('app');
import { defaultClient } from 'applicationinsights';
import { IdamAuth } from '../../app/idam-auth/IdamAuth';
import config from 'config';
import { UserEditController } from '../../controllers/UserEditController';
import { UserRemoveSsoController } from '../../controllers/UserRemoveSsoController';
import { AccessibilityStatementController } from '../../controllers/AccessibilityStatementController';
import { GenerateReportController } from '../../controllers/GenerateReportController';
import { ReportsHandler } from '../../app/reports/ReportsHandler';
import { DownloadReportController } from '../../controllers/DownloadReportController';
import { AddPrivateBetaServiceController } from '../../controllers/AddPrivateBetaServiceController';
import { AuthorizedAxios } from '../../app/authorized-axios/AuthorizedAxios';
import { InviteService } from '../../app/invite-service/InviteService';
import { ServiceProviderService } from '../../app/service-provider-service/ServiceProviderService';

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
      reportGenerator: asValue(new ReportsHandler(logger, defaultClient)),
      idamApiAxios: asValue(
        new AuthorizedAxios({
          baseURL: config.get('services.idam.url.api'),
          oauth: {
            clientId: config.get('services.idam.clientID'),
            clientSecret: config.get('services.idam.clientSecret'),
            clientScope: config.get('services.idam.clientScope'),
            tokenEndpoint: config.get('services.idam.endpoint.token'),
            autoRefresh: true,
          },
        })
      ),
      inviteService: asClass(InviteService),
      serviceProviderService: asClass(ServiceProviderService),
      userOptionController: asClass(UserOptionController),
      addUserController: asClass(AddUserController),
      addUserDetailsController: asClass(AddUserDetailsController),
      addUserRolesController: asClass(AddUserRolesController),
      userSsoController: asClass(UserRemoveSsoController),
      addPrivateBetaServiceController: asClass(AddPrivateBetaServiceController),
      manageUserController: asClass(ManageUserController),
      userEditController: asClass(UserEditController),
      userResultsController: asClass(UserResultsController),
      userActionsController: asClass(UserActionsController),
      userDeleteController: asClass(UserDeleteController),
      userSuspendController: asClass(UserSuspendController),
      accessibilityStatementController: asClass(AccessibilityStatementController),
      generateReportController: asClass(GenerateReportController),
      downloadReportController: asClass(DownloadReportController)
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
