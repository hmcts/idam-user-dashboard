import { Application, Request, Response, NextFunction } from 'express';
import { csrfSync } from 'csrf-sync';

const {
  csrfSynchronisedProtection
} = csrfSync();

export class Csrf {
  public enableFor(app: Application): void {
    app.use(csrfSynchronisedProtection);

    app.use((req: Request, res: Response, next: NextFunction) => {
      try {
        const token = req.csrfToken?.();
        if (token) res.locals.csrfToken = token;
        next();
      } catch (err) {
        next(err);
      }
    });
  }
}