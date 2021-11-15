import {asValue, createContainer, InjectionMode} from 'awilix';
import {Application} from 'express';

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
    });
  }
}
