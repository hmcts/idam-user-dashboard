import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { Application } from 'express';
import { UserOptionController } from '../../controllers/UserOptionController';
import { AddUsersController } from '../../controllers/AddUsersController';
import { ManageUsersController } from '../../controllers/ManageUsersController';
import { UserResultsController } from '../../controllers/UserResultsController';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('app');

/**
 * Sets up the dependency injection container
 */
export class Container {

  public enableFor(app: Application): void {
    app.locals.container = createContainer({ injectionMode: InjectionMode.CLASSIC }).register({
      logger: asValue(logger),
      exposeErrors: asValue(app.locals.env === 'development'),

      userOptionController: asClass(UserOptionController),
      addUsersController: asClass(AddUsersController),
      manageUsersController: asClass(ManageUsersController),
      userResultsController: asClass(UserResultsController),
    });
  }
}
