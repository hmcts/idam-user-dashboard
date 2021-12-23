import { glob } from 'glob';

const { Logger } = require('@hmcts/nodejs-logging');

import * as bodyParser from 'body-parser';
import config = require('config');
import express from 'express';
import { Helmet } from './modules/helmet';
import * as path from 'path';
import favicon from 'serve-favicon';
import { Nunjucks } from './modules/nunjucks';
import { PropertiesVolume } from './modules/properties-volume';
import { AppInsights } from './modules/appinsights';
import { OidcMiddleware } from './modules/oidc';
import { SessionStorage } from './modules/session';
import { Container } from './modules/awilix';
import { ErrorHandler } from './modules/error-handler';
import { HealthCheck } from './modules/health';
import { Csrf } from './modules/csrf';
import routes from './routes';

const { setupDev } = require('./development');
const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';
const logger = Logger.getLogger('app');

export const app = express();
app.locals.ENV = env;

app.use(favicon(path.join(__dirname, '/public/assets/images/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-cache, max-age=0, must-revalidate, no-store',
  );
  next();
});

new PropertiesVolume().enableFor(app);
new Container().enableFor(app);
new SessionStorage().enableFor(app);
new AppInsights().enable();
new Nunjucks(developmentMode).enableFor(app);
new Helmet(config.get('security')).enableFor(app);
new HealthCheck().enableFor(app);
new Csrf(logger).enableFor(app);
new OidcMiddleware().enableFor(app);

glob.sync(__dirname + '/routes/**/*.+(ts|js)')
  .map(filename => require(filename))
  .forEach(route => route.default(app));

setupDev(app, developmentMode);

// remaining routes
routes(app);

new ErrorHandler(logger).enableFor(app);
