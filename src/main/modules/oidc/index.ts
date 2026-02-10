import { Application, Request, Response } from 'express';
import config from 'config';
import { jwtDecode } from 'jwt-decode';
import { HTTPError } from '../../app/errors/HttpError';
import { constants as http } from 'http2';
import { Session } from 'express-openid-connect';
import RedisStore from 'connect-redis';
import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import { Redis } from 'ioredis';
import { User } from '../../interfaces/User';
import { auth } from 'express-openid-connect';
import logger from '../logging';
import { AuthedRequest } from 'interfaces/AuthedRequest';
import { isObjectEmpty } from '../../utils/utils';

export class OidcMiddleware {
  private readonly clientId: string = config.get('services.idam.clientID');
  private readonly clientSecret: string = config.get('services.idam.clientSecret');
  private readonly clientScope: string = config.get('services.idam.scope');
  private readonly baseUrl: string = config.get('services.idam.url.dashboard');
  private readonly idamBaseUrl: string = config.get('services.idam.url.public');
  private readonly sessionSecret: string = config.get('session.secret');
  private readonly accessRole: string = config.get('RBAC.access');
  private readonly sessionCookieName: string = config.get('session.cookie.name');

  public enableFor(app: Application): void {
    app.get('/callback', (req, res, next) => {
      if (!req.query.code) {
        return res.redirect('/login');
      }
      next();
    });
    app.use(auth({
      issuerBaseURL: this.idamBaseUrl + '/o',
      baseURL: this.baseUrl,
      httpTimeout: 15099,
      clientID: this.clientId,
      secret: this.sessionSecret,
      clientSecret: this.clientSecret,
      clientAuthMethod: 'client_secret_post',
      idpLogout: true,
      authorizationParams: {
        'response_type': 'code',
        scope: this.clientScope
      },
      session: {
        name: this.sessionCookieName,
        rollingDuration: 20 * 60,
        cookie: {
          httpOnly: true,
        },
        rolling: true,
        store: this.getSessionStore(app)
      },
      afterCallback: (req: Request, res: Response, session: Session) => {
        if (res.statusCode == http.HTTP_STATUS_OK && session.id_token) {
          let tokenUser;
          try {
            tokenUser = jwtDecode(session.id_token) as {
              uid: string,
              email: string,
              roles:string[]};
          } catch (error) {
            logger.error('afterCallback: token decode error', error);
            throw error;
          }
          const user = {
            id: tokenUser.uid,
            email: tokenUser.email,
            roles: tokenUser.roles
          } as User;
          logger.info('afterCallback: complete for user id ' + tokenUser.uid);
          return { ...session, user };
        } else {
          logger.error('afterCallback: failed with response code ' + res.statusCode);
          throw new HTTPError(http.HTTP_STATUS_FORBIDDEN);
        }
      }
    }));

    app.use((req: AuthedRequest, res: Response, next) => {
      logger.debug('OIDC middleware auth check', { isAuthenticated: req.oidc?.isAuthenticated?.() });

      const session = req.idam_user_dashboard_session;
      if (!session) {
        throw new HTTPError(http.HTTP_STATUS_FORBIDDEN);
      }

      const user = session.user;
      if (!user || isObjectEmpty(user)) {
        throw new HTTPError(http.HTTP_STATUS_FORBIDDEN);
      }

      if (!user.roles?.includes(this.accessRole)) {
        throw new HTTPError(http.HTTP_STATUS_FORBIDDEN);
      }

      next();
    });
  }

  private getSessionStore(app: Application): any {
    const fileStore = FileStoreFactory(session);

    const redisHost: string = config.get('session.redis.host');
    const redisPort: number = config.get('session.redis.port');
    const redisPass: string = config.get('session.redis.key');

    if (redisHost && redisPass) {
      const client = new Redis({ port: redisPort, host: redisHost, password: redisPass, tls: {} });

      app.locals.redisClient = client;
      return new RedisStore({
        client: client,
        prefix: 'idam_hmcts_access:',
      });
    }

    return new fileStore({ path: '/tmp' });
  }

}
