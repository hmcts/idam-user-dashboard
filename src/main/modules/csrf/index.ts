import csrf from 'csurf';
import { Application, NextFunction, Response, Request } from 'express';
import { Logger } from '../../interfaces/Logger';

export class Csrf {
  constructor(public logger: Logger) {
    this.logger = logger;
  }

  public enableFor(app: Application): void {
    app.use(csrf(), (req: Request, res: Response, next: NextFunction) => {
      res.locals.csrfToken = req.csrfToken();
      next();
    });
  }
}
