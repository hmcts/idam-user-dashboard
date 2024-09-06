import { Application, NextFunction, Request, Response } from 'express';
import config from 'config';
import { AuthedRequest } from '../../interfaces/AuthedRequest';
import { asClass, asValue } from 'awilix';
import { IdamAPI } from '../../app/idam-api/IdamAPI';
import axios, { AxiosInstance } from 'axios';
import jwtDecode from 'jwt-decode';
import { HTTPError } from '../../app/errors/HttpError';
import { constants as httpconstants } from 'http2';
import { Session } from 'express-openid-connect';
import RedisStore from 'connect-redis';
import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import { Redis } from 'ioredis';
import { User } from '../../interfaces/User';
import { auth } from 'express-openid-connect';
const {Logger} = require('@hmcts/nodejs-logging');
import { TelemetryClient } from 'applicationinsights';
import * as http from 'http';
import * as https from 'https';

const retryRequest = async (options: http.RequestOptions, retries: number): Promise<http.IncomingMessage> => {
  return new Promise((resolve, reject) => {
    const request = options.protocol === 'https:' ? https.request : http.request;

    const attempt = (retryCount: number) => {
      const req = request(options, (res) => {
        if (res.statusCode && res.statusCode >= 500 && retryCount > 0) {
          console.log(`Retrying request... (${retries - retryCount + 1})`);
          return attempt(retryCount - 1);
        }
        resolve(res);
      });

      req.on('error', (err) => {
        if (retryCount > 0) {
          console.log(`Retrying request due to error... (${retries - retryCount + 1})`);
          return attempt(retryCount - 1);
        }
        reject(err);
      });

      req.end();
    };

    attempt(retries);
  });
};

class CustomHttpAgent extends http.Agent {
  constructor(options?: http.AgentOptions) {
    super(options);
  }

  addRequest(req: http.ClientRequest, options: http.RequestOptions) {
    retryRequest(options, 3).then((res) => {
      req.emit('response', res);
    }).catch((err) => {
      console.log("CustomHttpsAgent error ", err);
      req.emit('error', err);
    });
  }
}

class CustomHttpsAgent extends https.Agent {
  constructor(options?: https.AgentOptions) {
    super(options);
  }

  addRequest(req: http.ClientRequest, options: http.RequestOptions) {
    retryRequest(options, 3).then((res) => {
      req.emit('response', res);
    }).catch((err) => {
      console.log("CustomHttpsAgent error ", err);
      req.emit('error', err);
    });
  }
}

const customHttpAgent = new CustomHttpAgent();
const customHttpsAgent = new CustomHttpsAgent();

export class OidcMiddleware {
  private readonly clientId: string = config.get('services.idam.clientID');
  private readonly clientSecret: string = config.get('services.idam.clientSecret');
  private readonly clientScope: string = config.get('services.idam.scope');
  private readonly baseUrl: string = config.get('services.idam.url.dashboard');
  private readonly idamBaseUrl: string = config.get('services.idam.url.public');
  private readonly sessionSecret: string = config.get('session.secret');
  private readonly accessRole: string = config.get('RBAC.access');
  private readonly sessionCookieName: string = config.get('session.cookie.name');

  constructor(private readonly logger: typeof Logger, private readonly telemetryClient: TelemetryClient) {}

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
      httpAgent: {
        http: customHttpAgent,
        https: customHttpsAgent
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
        if (res.statusCode == httpconstants.HTTP_STATUS_OK && session.id_token) {
          let tokenUser;
          try {
            tokenUser = jwtDecode(session.id_token) as {
              uid: string,
              email: string,
              roles:string[]};
          } catch (error) {
            console.log('(console) afterCallback: token decode error', error);
            this.logger.error('afterCallback: token decode error', error);
            throw error;
          }
          if (!tokenUser.roles.includes(this.accessRole)) {
            console.log('(console) afterCallback: missing access role for user id %s', tokenUser.uid);
            throw new HTTPError(httpconstants.HTTP_STATUS_FORBIDDEN);
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
          throw new HTTPError(httpconstants.HTTP_STATUS_FORBIDDEN);
        }
      }
    }));

    app.use((req: AuthedRequest, res: Response, next: NextFunction) => {
      req.scope = req.app.locals.container.createScope().register({
        userAxios: asValue(this.createAuthedAxiosInstance(req, req.idam_user_dashboard_session.access_token, this.telemetryClient)),
        api: asClass(IdamAPI)
      });

      if (!req.idam_user_dashboard_session.user.assignableRoles) {
        return req.scope.cradle.api.getAssignableRoles(req.idam_user_dashboard_session.user.roles)
          .then(assignableRoles => {
            req.idam_user_dashboard_session.user.assignableRoles = assignableRoles;
            next();
          })
          .catch(err => {
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

  private createAuthedAxiosInstance(req: AuthedRequest, accessToken: string, telemetryClient: TelemetryClient): AxiosInstance {
    console.log('Setting up user axios, oidc is %j', req.oidc);
    const createdAxios = axios.create({
      baseURL: config.get('services.idam.url.api'),
      headers: {Authorization: 'Bearer ' + accessToken}
    });
    createdAxios.interceptors.response.use(function (response) {
      return response;
    }, function (error) {
      if (error?.response) {
        console.log('Axios call failed with response code ' + error.response.status + ', data: ' + JSON.stringify(error.response.data));
        telemetryClient.trackException({exception: error});
      }
      return Promise.reject(error);
    });
    return createdAxios;
  }

}
