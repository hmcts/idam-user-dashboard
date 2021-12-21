import express, { Application } from 'express';
import { HTTPError } from '../../HttpError';
import { LoggerInstance } from 'winston';

export class ErrorHandler {
  constructor(public logger: LoggerInstance) {
    this.logger = logger;
  }

  public enableFor(app: Application): void {
    // returning "not found" page for requests with paths not resolved by the router
    app.use((req, res) => {
      res.status(404);
      res.render('not-found');
    });

    // error handler
    app.use((err: HTTPError, req: express.Request, res: express.Response) => {
      this.logger.error(`${err.stack || err}`);

      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = app.locals.ENV === 'development' ? err : {};
      res.status(err.status || 500);
      res.render('error');
    });
  }
}
