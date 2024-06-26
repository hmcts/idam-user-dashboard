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
import ConnectRedis from 'connect-redis';
import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import { createClient } from 'redis';
import { User } from '../../interfaces/User';
import { Issuer, TokenSet } from 'openid-client';
import { auth } from 'express-openid-connect';
import { Logger } from '../../interfaces/Logger';

export class OidcMiddleware {
  private readonly clientId: string = config.get('services.idam.clientID');
  private readonly clientSecret: string = config.get('services.idam.clientSecret');
  private readonly clientScope: string = config.get('services.idam.scope');
  private readonly baseUrl: string = config.get('services.idam.url.dashboard');
  private readonly idamBaseUrl: string = config.get('services.idam.url.public');
  private readonly sessionSecret: string = config.get('session.secret');
  private readonly accessRole: string = config.get('RBAC.access');
  private readonly systemAccountUsername: string = config.get('services.idam.systemUser.username');
  private readonly systemAccountPassword: string = config.get('services.idam.systemUser.password');
  private readonly sessionCookieName: string = config.get('session.cookie.name');

  constructor(private readonly logger: Logger) {}

  public enableFor(app: Application): void {
    this.cacheSystemAccount(app);
    this.cacheClientCredentialsToken(app);

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
            console.log('afterCallback: token decode error', error);
            throw error;
          }
          if (!tokenUser.roles.includes(this.accessRole)) {
            console.log('afterCallback: missing access role for user id %s', tokenUser.uid);
            throw new HTTPError(http.HTTP_STATUS_FORBIDDEN);
          }
          const user = {
            id: tokenUser.uid,
            email: tokenUser.email,
            roles: tokenUser.roles
          } as User;
          console.log('afterCallback: complete for user id %s', tokenUser.uid);
          return { ...session, user };
        } else {
          console.log('afterCallback: failed with response code %s', res.statusCode);
          throw new HTTPError(http.HTTP_STATUS_FORBIDDEN);
        }
      }
    }));

    app.use((req: AuthedRequest, res: Response, next: NextFunction) => {
      req.scope = req.app.locals.container.createScope().register({
        userAxios: asValue(this.createAuthedAxiosInstance(req.idam_user_dashboard_session.access_token)),
        api: asClass(IdamAPI)
      });

      if (!req.idam_user_dashboard_session.user.assignableRoles) {
        return req.scope.cradle.api.getAssignableRoles(req.idam_user_dashboard_session.user.roles)
          .then(assignableRoles => {
            req.idam_user_dashboard_session.user.assignableRoles = assignableRoles;
            next();
          })
          .catch(err => next(err));
      }

      return next();
    });
  }

  private getSessionStore(app: Application): any {
    const redisStore = ConnectRedis(session);
    const fileStore = FileStoreFactory(session);

    const redisHost: string = config.get('session.redis.host');
    const redisPort: number = config.get('session.redis.port');
    const redisPass: string = config.get('session.redis.key');

    if (redisHost && redisPass) {
      const client = createClient({
        host: redisHost,
        password: redisPass,
        port: redisPort ?? 6380,
        tls: true
      });

      app.locals.redisClient = client;
      return new redisStore({ client });
    }

    return new fileStore({ path: '/tmp' });
  }

  private cacheSystemAccount = (app: Application): void => {
    let delay = 10 * 60;

    this.getSystemUserAccessToken()
      .then(tokenSet => {
        app.locals.container.register({
          systemAxios: asValue(this.createAuthedAxiosInstance(tokenSet.access_token))
        });

        delay = tokenSet.expires_in/2;
        this.logger.info('Refreshed system user token. Refreshing again in: ' + Math.floor(delay/60) + 'mins');
      })
      .catch(() => this.logger.info('Failed to refresh system user token. Refreshing again in: ' + delay/60 + 'mins'))
      .finally(() => setTimeout(this.cacheSystemAccount, delay * 1000, app));
  };

  private cacheClientCredentialsToken = (app: Application): void => {
    let delay = 10 * 60;

    this.getClientCredentialsAccessToken()
      .then(tokenSet => {
        app.locals.container.register({
          clientAxios: asValue(this.createAuthedAxiosInstance(tokenSet.access_token))
        });

        delay = tokenSet.expires_in/2;
        this.logger.info('Refreshed client credentials token. Refreshing again in: ' + Math.floor(delay/60) + 'mins');
      })
      .catch((err) => this.logger.info('Failed to refresh client credentials token. Refreshing again in: ' + delay/60 + 'mins' + err))
      .finally(() => setTimeout(this.cacheClientCredentialsToken, delay * 1000, app));
  };

  private createAuthedAxiosInstance(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: config.get('services.idam.url.api'),
      headers: {Authorization: 'Bearer ' + accessToken}
    });
  }

  private async getSystemUserAccessToken(): Promise<TokenSet> {
    return new (await Issuer.discover(this.idamBaseUrl + '/o'))
      .Client({
        'client_id': this.clientId,
        'client_secret': this.clientSecret,
        'token_endpoint_auth_method': 'client_secret_post'
      }).grant({
        'grant_type': 'password',
        'username': this.systemAccountUsername,
        'password': this.systemAccountPassword,
        'scope': this.clientScope,
      });
  }

  private async getClientCredentialsAccessToken(): Promise<TokenSet> {
    const usableScopes = this.clientScope
      .replace('openid', '')
      .replace('profile', '')
      .replace('roles', '').trim();
    return new (await Issuer.discover(this.idamBaseUrl + '/o'))
      .Client({
        'client_id': this.clientId,
        'client_secret': this.clientSecret,
        'token_endpoint_auth_method': 'client_secret_post'
      }).grant({
        'grant_type': 'client_credentials',
        'scope': usableScopes
      });
  }
}
