import express, {Application, NextFunction} from 'express';
import { HTTPError } from '../../app/errors/HttpError';
import { constants as http } from 'http2';
import { v4 as uuid } from 'uuid';
import logger from '../logging';
import { isObjectEmpty } from '../../utils/utils';
import { AuthedRequest } from 'interfaces/AuthedRequest';
import { User } from 'interfaces/User';
const obfuscate = require('obfuscate-mail');

const NOT_FOUND = {
  title: 'Page not found',
  suggestions: [
    'If you typed the web address, check it is correct.',
    'If you pasted the web address, check you copied the entire address.'
  ]
};
const UNAUTHORIZED = {
  title: 'Sorry, access to this resource requires authorisation',
  suggestions: [
    'Please ensure you have logged into the service.',
    'Contact a system administrator if you continue to receive this error after signing in.'
  ]
};
const FORBIDDEN = {
  title: 'Sorry, access to this resource is forbidden',
  suggestions: [
    'Please ensure you have the correct permissions to access this resource.',
    'Contact a system administrator if you should have access to this resource.'
  ]
};
const SERVER_ERROR = {
  title: 'Sorry, there is a problem with the service',
  suggestions: ['Please try again later.']
};

function getErrorLogContext(
  error: Error,
  req: AuthedRequest,
  principal: Partial<User> | undefined,
  status: number,
  errorUUID?: string
): Record<string, string | number | undefined> {
  return {
    errorUUID,
    errorName: error.name,
    status,
    message: error.message,
    method: req.method,
    url: req.originalUrl || req.url,
    principalId: principal?.id,
    principalEmail: principal?.email ? obfuscate(principal.email) : undefined,
    stack: error.stack,
  };
}

export class ErrorHandler {

  public enableFor(app: Application): void {
    // returning "not found" page for requests with paths not resolved by the router
    app.use((req, res) => {
      const status = http.HTTP_STATUS_NOT_FOUND;
      logger.error('error-handler, returning not found for: ' + req.method + ' ' + req.url);
      res.status(status);
      res.render('error.njk', {...NOT_FOUND, status});
    });

    // error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((error: HTTPError, req: AuthedRequest, res: express.Response, next: NextFunction) => {
      res.locals.error = app.locals.ENV === 'development' ? error : {};
      let errorSummary: ErrorSummary;
      let errorUUID: string;
      let principal: Partial<User>;
      const status = error.status || 500;
    
      if(req.idam_user_dashboard_session) {
        const sessionPrincipal = req.idam_user_dashboard_session.user;
        if(sessionPrincipal && !isObjectEmpty(sessionPrincipal)) {
          principal = sessionPrincipal;
        }
      }

      switch(status) {
        case http.HTTP_STATUS_UNAUTHORIZED:
          errorSummary = UNAUTHORIZED;
          logger.warn('Handled HTTPError', getErrorLogContext(error, req, principal, status));
          break;
        case http.HTTP_STATUS_FORBIDDEN:
          errorSummary = FORBIDDEN;
          logger.warn('Handled HTTPError', getErrorLogContext(error, req, principal, status));
          break;
        default:
          errorSummary = SERVER_ERROR;
          errorUUID = uuid();
          logger.error('Unhandled HTTPError', getErrorLogContext(error, req, principal, status, errorUUID));
      }

      res.status(status);
      res.render('error.njk', {...errorSummary, status, errorUUID, user: principal});
    });
  }
}

interface ErrorSummary {
  title: string;
  suggestions?: string[];
}
