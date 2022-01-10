import csrf = require('csurf')
import { Application, NextFunction, Response } from 'express';
import { AuthedRequest } from '../../types/AuthedRequest';
import { Logger } from '../../interfaces/Logger';
import { HTTPError } from '../../HttpError';

export class Csrf {
  constructor(public logger: Logger) {
    this.logger = logger;
  }

  public enableFor(app: Application): void {

    app.use('/form', csrf, (req: AuthedRequest, res: Response) => {
      res.send({ csrfToken : req.csrfToken() });
    });

    app.use((error: HTTPError, req: AuthedRequest, res: Response, next: NextFunction) => {
      if (error.code === 'EBADCSRFTOKEN') {
        this.logger.error(`${error.stack || error}`);
        return res.render('error');
      }
      next();
    });
  }
}
