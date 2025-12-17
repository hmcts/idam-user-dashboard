import { Application, Request, Response, NextFunction } from 'express';
import { csrfSync } from 'csrf-sync';

const {
  csrfSynchronisedProtection
} = csrfSync({
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],

  getTokenFromRequest: (req) =>
    req.body?._csrf || req.headers['x-csrf-token'] as string,

  getTokenFromState: (req) => req.session.csrfToken,

  storeTokenInState: (req, token) => {
    req.session.csrfToken = token;
  },
});

export class Csrf {
  public enableFor(app: Application): void {
    app.use(csrfSynchronisedProtection);

    app.use((req: Request, res: Response, next: NextFunction) => {
      try {
        const token = req.csrfToken();
        if (token) res.locals.csrfToken = token;
        next();
      } catch (err) {
        next(err);
      }
    });
  }
}