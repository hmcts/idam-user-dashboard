import { Application, NextFunction, Request, Response } from 'express';
import config from 'config';
import { AuthedRequest } from '../../interfaces/AuthedRequest';
import { asClass, asValue } from 'awilix';
import { IdamAPI } from '../../app/idam-api/IdamAPI';
import axios, { AxiosInstance } from 'axios';
import jwtDecode from 'jwt-decode';
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
            console.log('(console) afterCallback: token decode error', error);
            logger.error('afterCallback: token decode error', error);
            throw error;
          }
          if (!tokenUser.roles.includes(this.accessRole)) {
            console.log('(console) afterCallback: missing access role for user id %s', tokenUser.uid);
            throw new HTTPError(http.HTTP_STATUS_FORBIDDEN);
          }
          const user = {
            id: tokenUser.uid,
            email: tokenUser.email,
            roles: tokenUser.roles
          } as User;
          console.log('(console) afterCallback: complete for user id %s', tokenUser.uid);
          return { ...session, user };
        } else {
          console.log('(console) afterCallback: failed with response code %s', res.statusCode);
          throw new HTTPError(http.HTTP_STATUS_FORBIDDEN);
        }
      }
    }));

    app.use((req: AuthedRequest, res: Response, next: NextFunction) => {
      if (!req.idam_user_dashboard_session.user.assignableRoles) {
        return req.app.locals.container.cradle.idamWrapper.getAssignableRoles(req.idam_user_dashboard_session.user.roles)
          .then((assignableRoles: string[]) => {
            req.idam_user_dashboard_session.user.assignableRoles = assignableRoles;
            next();
          })
          .catch((err: any) => {
            console.log('Failed to get assignable roles', err);
            next(err);
          });
      }

      return next();
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
