import {Application, NextFunction, Request, Response} from 'express';
import {asClass, asValue} from 'awilix';
import Axios from 'axios';
import config from 'config';
import {AuthedRequest} from '../../types/AuthedRequest';
// eslint-disable-next-line @typescript-eslint/camelcase
import jwt_decode from 'jwt-decode';
import {Api} from '../../Api';
import {HOME_URL, LOGIN_URL, LOGOUT_URL, OAUTH2_CALLBACK_URL} from '../../utils/urls';
import {Logger} from '../../interfaces/Logger';

export class OidcMiddleware {

  constructor(public logger: Logger) {
    this.logger = logger;
  }

  public enableFor(app: Application): void {
    const idamPublicUrl: string = config.get('services.idam.url.public');
    const authorizationURL: string = idamPublicUrl + config.get('services.idam.endpoint.authorization');
    const tokenUrl: string = idamPublicUrl + config.get('services.idam.endpoint.token');
    const clientId: string = config.get('services.idam.clientID');
    const clientSecret: string = config.get('services.idam.clientSecret');
    const redirectUri: string = config.get('services.idam.callbackURL');
    const responseType: string = config.get('services.idam.responseType');
    const scope: string = config.get('services.idam.scope');

    app.get(LOGIN_URL, (req: Request, res: Response) => {
      // Redirect to IDAM web public to get the authorization code
      res.redirect(`${authorizationURL}?client_id=${clientId}&response_type=${responseType}&redirect_uri=${encodeURI(redirectUri)}&scope=${encodeURIComponent(scope)}`);
    });

    app.get(OAUTH2_CALLBACK_URL, async (req: Request, res: Response) => {
      try {
        const response: idamResponse = (await Axios.post(
          tokenUrl,
          new URLSearchParams({
            'client_id': clientId,
            'client_secret': clientSecret,
            'grant_type': 'authorization_code',
            'redirect_uri': redirectUri,
            code: req.query.code as string,
          }),
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )).data;

        const jwt: JWT = jwt_decode(response.id_token);

        req.session.user = {
          accessToken: response.access_token,
          idToken: response.id_token,
          id: jwt.uid,
          roles: jwt.roles,
        };

        req.session.save(() => res.redirect(HOME_URL));
      } catch (e) {
        this.logger.error(e);
        return res.redirect('/');
      }
    });

    app.get(LOGOUT_URL, (req: Request, res: Response) => {
      res.locals.isLoggedIn = false;
      req.session.destroy(() => res.redirect('/'));
    });

    app.use((req: AuthedRequest, res: Response, next: NextFunction) => {
      if (req.session.user) {
        this.configureApiAuthorization(req);
        res.locals.isLoggedIn = true;
        return next();
      }

      res.redirect(LOGIN_URL);
    });
  }

  private configureApiAuthorization(req: AuthedRequest): void {
    req.scope = req.app.locals.container.createScope();
    req.scope.register({
      axios: asValue(Axios.create({
        baseURL: config.get('services.idam.url.api'),
        headers: {
          Authorization: 'Bearer ' + req.session.user.access_token
        }
      })),
      api: asClass(Api)
    });
  }
}

export type AuthedUser = {
  id_token: string;
}

type JWT = {
  uid: string;
  roles: string[];
}

type idamResponse = {
  access_token: string;
  id_token: string;
}
