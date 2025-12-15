import { glob } from 'glob';
import * as path from 'path';
import config = require('config');
import { PropertiesVolume } from './modules/properties-volume';
import { initializeTelemetry } from './modules/opentelemetry';

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';
new PropertiesVolume().enableFor(env);
initializeTelemetry();

import express from 'express';
import * as bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import cookieParser from 'cookie-parser';

import { Helmet } from './modules/helmet';
import { Nunjucks } from './modules/nunjucks';
import { OidcMiddleware } from './modules/oidc';
import { Container } from './modules/awilix';
import { ErrorHandler } from './modules/error-handler';
import { HealthCheck } from './modules/health';
import { Csrf } from './modules/csrf';
import { AppSession } from './modules/session';
import routes from './routes';
import logger from './modules/logging';
const { setupDev } = require('./development');

export const app = express();
app.locals.ENV = env;

logger.info('app logger is at level ' + logger.level);

async function bootstrap() {
  app.use(favicon(path.join(__dirname, '/public/assets/images/favicon.ico')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader(
      'Cache-Control',
      'no-cache, max-age=0, must-revalidate, no-store',
    );
    next();
  });

  new Container().enableFor(app);
  new Helmet(config.get('security')).enableFor(app);
  new HealthCheck().enableFor(app);
  new AppSession().enableFor(app);
  new OidcMiddleware().enableFor(app);
  new Csrf().enableFor(app);
  new Nunjucks(developmentMode).enableFor(app);

  const routeFiles = await glob(path.join(__dirname, 'routes/**/*.+(ts|js)'));
  routeFiles
    .map((filename: string) => require(filename))
    .forEach((route: { default: (app: express.Express) => void }) => {
      if (route?.default) {
        route.default(app);
      }
    });

  setupDev(app, developmentMode);

  // Remaining fallback routes
  routes(app);

  new ErrorHandler().enableFor(app);
}

// Start bootstrap process
bootstrap().catch(err => {
  logger.error('Failed to bootstrap app:', err);
  process.exit(1);
});
