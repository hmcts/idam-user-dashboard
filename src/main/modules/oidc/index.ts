import {Application, NextFunction, Request, Response} from 'express';
import {asClass, asValue} from 'awilix';
import Axios from 'axios';
import config from 'config';
import {AuthedRequest} from '../../interfaces/AuthedRequest';
// eslint-disable-next-line @typescript-eslint/camelcase
import jwt_decode from 'jwt-decode';
import {IdamAPI} from '../../app/idam-api/IdamAPI';
import {HOME_URL, LOGIN_URL, LOGOUT_URL, OAUTH2_CALLBACK_URL} from '../../utils/urls';
import {Logger} from '../../interfaces/Logger';
import * as appInsights from 'applicationinsights';
import { HTTPError } from '../../app/errors/HttpError';
import { constants as http } from 'http2';

export class OidcMiddleware {

  constructor(public logger: Logger) {
    this.logger = logger;
  }

  public enableFor(app: Application): void {
    const IDAM_API = config.get('services.idam.url.api');
    const IDAM_PUBLIC = config.get('services.idam.url.public');

    const { authorization, token, endSession } = config.get('services.idam.endpoint');
    const { clientID, clientSecret, responseType, callbackURL, scope } = config.get('services.idam');
    const authParams = new URLSearchParams({
      'client_id': clientID,
      'response_type': responseType,
      'redirect_uri': callbackURL,
      'scope': scope
    }).toString();

    app.get(LOGIN_URL, (req: Request, res: Response) => {
      res.redirect(`${IDAM_PUBLIC + authorization}?${authParams}&prompt=login`);
    });

    app.get(OAUTH2_CALLBACK_URL, async (req: Request, res: Response) => {
      try {
        const response: idamResponse = (await Axios.post(
          IDAM_PUBLIC + token,
          new URLSearchParams({
            'client_id': clientID,
            'client_secret': clientSecret,
            'grant_type': 'authorization_code',
            'redirect_uri': callbackURL,
            'code': req.query.code as string,
          })
        )).data;

        const jwt: JWT = jwt_decode(response.id_token);

        req.session.user = {
          accessToken: response.access_token,
          idToken: response.id_token,
          id: jwt.uid,
          name: jwt.name,
          email: jwt.sub,
          roles: jwt.roles,
        };

        req.session.save(() => res.redirect(HOME_URL));
      } catch (error) {
        const message = 'Failed to sign in with the authorization code. '
          + (error.response?.data?.error_description ? error.response.data.error_description : '');
        appInsights.defaultClient.trackTrace({message: message});
        this.logger.error(message);
        return res.redirect(HOME_URL);
      }
    });

    app.get(LOGOUT_URL, async (req: Request, res: Response) => {
      if (req.session.user) {
        try {
          await Axios.get(
            IDAM_API + endSession,
            { params: new URLSearchParams({
              'id_token_hint': req.session.user.idToken,
              'post_logout_redirect_uri': `${req.protocol}://${req.headers.host}`
            })}
          );
        } catch (e) {
          const message = 'Failed to end IDAM session for user: ' + req.session.user.id;
          appInsights.defaultClient.trackTrace({message: message});
          this.logger.error(message);
        }

        req.session.destroy( () => {
          res.clearCookie(config.get('session.cookie.name'));
          res.redirect(LOGIN_URL);
        });
      } else {
        res.redirect(LOGIN_URL);
      }
    });

    app.use(async (req: AuthedRequest, res: Response, next: NextFunction) => {
      if (req.session.user) {
        if (req.session.user.roles.includes(config.get('RBAC.access'))) {
          this.configureApiAuthorization(req);

          if (!req.session.user.assignableRoles) {
            await this.storeAssignableRoles(req);
          }

          return next();
        } else {
          return next(new HTTPError(http.HTTP_STATUS_FORBIDDEN));
        }
      }

      res.redirect(LOGIN_URL);
    });
  }

  private configureApiAuthorization(req: AuthedRequest): void {
    req.scope = req.app.locals.container.createScope().register({
      axios: asValue(Axios.create({
        baseURL: config.get('services.idam.url.api'),
        headers: { Authorization: 'Bearer ' + req.session.user.accessToken }
      })),
      api: asClass(IdamAPI)
    });
  }

  private async storeAssignableRoles(req: AuthedRequest): Promise<void> {
    req.session.user.assignableRoles = await req.scope.cradle.api.getAssignableRoles(req.session.user.roles);
  }
}

type JWT = {
  uid: string;
  sub: string;
  name: string;
  roles: string[];
}

type idamResponse = {
  access_token: string;
  id_token: string;
}
