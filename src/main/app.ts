import { glob } from 'glob';
import * as path from 'path';
import config = require('config');
import { PropertiesVolume } from './modules/properties-volume';
import { AppInsights } from './modules/appinsights';

import { Logger } from '@hmcts/nodejs-logging';

import * as bodyParser from 'body-parser';
import express from 'express';
import { Helmet } from './modules/helmet';

import favicon from 'serve-favicon';
import { Nunjucks } from './modules/nunjucks';

import { OidcMiddleware } from './modules/oidc';
import { Container } from './modules/awilix';
import { ErrorHandler } from './modules/error-handler';
import { HealthCheck } from './modules/health';
import { Csrf } from './modules/csrf';
import routes from './routes';
import cookieParser from 'cookie-parser';

const { setupDev } = require('./development');
const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

export const app = express();
app.locals.ENV = env;

new PropertiesVolume().enableFor(app);
new AppInsights().enable();
const logger = Logger.getLogger('app');
console.log('(console) app logger is at level ' + logger.level);

app.use(favicon(path.join(__dirname, '/public/assets/images/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-cache, max-age=0, must-revalidate, no-store',
  );
  next();
});


new Container().enableFor(app);
new Nunjucks(developmentMode).enableFor(app);
new Helmet(config.get('security')).enableFor(app);
new HealthCheck().enableFor(app);
new Csrf().enableFor(app);
new OidcMiddleware(logger).enableFor(app);

glob.sync(__dirname + '/routes/**/*.+(ts|js)')
  .map(filename => require(filename))
  .forEach(route => route.default(app));

setupDev(app, developmentMode);

// remaining routes
routes(app);

new ErrorHandler(logger).enableFor(app);
