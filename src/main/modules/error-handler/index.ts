import express, { Application } from 'express';
import { HTTPError } from '../../HttpError';
import { Logger } from '../../interfaces/Logger';

export class ErrorHandler {
  constructor(public logger: Logger) {
    this.logger = logger;
  }

  public enableFor(app: Application): void {
    // returning "not found" page for requests with paths not resolved by the router
    app.use((req, res) => {
      res.status(404);
      res.render('not-found');
    });

    // error handler
    app.use((error: HTTPError, req: express.Request, res: express.Response) => {
      this.logger.error(`${error.stack || error}`);

      // set locals, only providing error in development
      res.locals.message = error.message;
      res.locals.error = app.locals.ENV === 'development' ? error : {};
      res.status(error.status || 500);
      res.render('error');
    });
  }
}
