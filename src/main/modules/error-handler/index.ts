import express, {Application, NextFunction} from 'express';
import { HTTPError } from '../../app/errors/HttpError';
import { constants as http } from 'http2';
import { v4 as uuid } from 'uuid';
import logger from '../logging';
import { isObjectEmpty } from '../../utils/utils';
import { AuthedRequest } from 'interfaces/AuthedRequest';
import { User } from 'interfaces/User';

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
      let user: Partial<User>;
      const status = error.status || 500;
    
      if(req.idam_user_dashboard_session) {
        const sessionUser = req.idam_user_dashboard_session.user;
        if(sessionUser && !isObjectEmpty(sessionUser)) {
          user = sessionUser;
        }
      }

      switch(status) {
        case http.HTTP_STATUS_UNAUTHORIZED:
          errorSummary = UNAUTHORIZED;
          break;
        case http.HTTP_STATUS_FORBIDDEN:
          errorSummary = FORBIDDEN;
          break;
        default:
          errorSummary = SERVER_ERROR;
          errorUUID = uuid();
          logger.error(`(logger) errorUUID: ${errorUUID} \n ${error.stack || error}`);
      }

      res.status(status);
      res.render('error.njk', {...errorSummary, status, errorUUID, user});
    });
  }
}

interface ErrorSummary {
  title: string;
  suggestions?: string[];
}
