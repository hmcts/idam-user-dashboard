import { Application, NextFunction, Request, Response } from 'express';
import { asClass, asValue } from 'awilix';
import config from 'config';
import { AppSession, AuthedRequest } from '../../interfaces/AuthedRequest';
import { HOME_URL, LOGIN_URL, LOGOUT_URL, OAUTH2_CALLBACK_URL } from '../../utils/urls';
import { Logger } from '../../interfaces/Logger';
import { HTTPError } from '../../app/errors/HttpError';
import { constants as http } from 'http2';
import { IdamAuth, OIDCSession } from '../../app/idam-auth/IdamAuth';
import { IdamAPI } from '../../app/idam-api/IdamAPI';
import { OIDCToken } from '../../app/idam-auth/OIDCToken';
import { defaultClient } from 'applicationinsights';

export class OidcMiddleware {

  constructor(
    private readonly logger: Logger
  ) {}

  public enableFor(app: Application): void {
    const idamAuth = new IdamAuth(this.logger, defaultClient);
    const ACCESS_ROLE: string = config.get('RBAC.access');

    app.get(LOGIN_URL, (req: Request, res: Response) => res.redirect(idamAuth.getAuthorizeRedirect()));

    app.get(OAUTH2_CALLBACK_URL, (req: Request, res: Response, next: NextFunction) => {
      return idamAuth.authorizeCode(req.query.code as string)
        .then(newSession => this.saveConfiguredSession(newSession, req.session))
        .then(() => res.redirect(HOME_URL))
        .catch(error => next(error));
    });

    app.get(LOGOUT_URL, (req: AuthedRequest, res: Response) => {
      if (!req.session.user) return res.redirect(LOGIN_URL);
      const idToken = req.session.tokens.idToken;

      req.session.destroy(() => {
        res.clearCookie(config.get('session.cookie.name'));
        res.redirect(idamAuth.getEndSessionRedirect(idToken));
      });
    });

    // Reject any logged out, expired or bad sessions
    app.use((req: AuthedRequest, res: Response, next: NextFunction) => {
      const {user, tokens} = req.session;

      if (!user) {
        return res.redirect(LOGIN_URL);
      }

      if (OIDCToken.isExpired(tokens.accessToken)) {
        return req.session.destroy(() => {
          res.clearCookie(config.get('session.cookie.name'));
          res.redirect(LOGIN_URL);
        });
      }

      if (!user.roles.includes(ACCESS_ROLE)) {
        return req.session.destroy(() => {
          res.clearCookie(config.get('session.cookie.name'));
          next(new HTTPError(http.HTTP_STATUS_FORBIDDEN));
        });
      }

      return next();
    });

    // Refresh access token if close to expiring
    app.use(async (req: AuthedRequest, res: Response, next: NextFunction) => {
      const {accessToken, refreshToken} = req.session.tokens;

      if (OIDCToken.isStale(accessToken)) {
        await idamAuth.authorizeRefresh(refreshToken.raw)
          .then(refreshedSession => this.saveConfiguredSession(refreshedSession, req.session))
          .catch(error => next(error));
      }

      return next();
    });

    // Configure API
    app.use((req: AuthedRequest, res: Response, next: NextFunction) => {
      req.scope = req.app.locals.container.createScope().register({
        userAxios: asValue(idamAuth.getUserAxios(req.session.tokens.accessToken)),
        api: asClass(IdamAPI)
      });

      if (!req.session.user.assignableRoles) {
        return req.scope.cradle.api.getAssignableRoles(req.session.user.roles)
          .then(assignableRoles => {
            req.session.user.assignableRoles = assignableRoles;
            next();
          })
          .catch(err => next(err));
      }

      return next();
    });
  }

  private saveConfiguredSession(newSession: OIDCSession, session: Partial<AppSession>): Promise<AppSession> {
    return new Promise((resolve) => {
      session.user = newSession.user;
      session.tokens = newSession.tokens;
      session.save(() => resolve(session as AppSession));
    });
  }
}
