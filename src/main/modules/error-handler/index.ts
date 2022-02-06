import express, {Application, NextFunction} from 'express';
import { HTTPError } from '../../HttpError';
import { Logger } from '../../interfaces/Logger';
import { constants as http } from 'http2';
import { v4 as uuid } from 'uuid';

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
  constructor(public logger: Logger) {
    this.logger = logger;
  }

  public enableFor(app: Application): void {
    // returning "not found" page for requests with paths not resolved by the router
    app.use((req, res) => {
      const status = http.HTTP_STATUS_NOT_FOUND;
      res.status(status);
      res.render('error.njk', {...NOT_FOUND, status});
    });

    // error handler
    app.use((error: HTTPError, req: express.Request, res: express.Response, next: NextFunction) => {
      res.locals.error = app.locals.ENV === 'development' ? error : {};
      let errorSummary: ErrorSummary;
      let errorUUID: string;
      const status = error.status || 500;

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
          this.logger.error(`errorUUID: ${errorUUID} \n ${error.stack || error}`);
      }

      res.status(status);
      res.render('error.njk', {...errorSummary, status, errorUUID});
    });
  }
}

interface ErrorSummary {
  title: string;
  suggestions?: string[];
}
