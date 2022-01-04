import {Application, NextFunction, Request, Response} from 'express';
import {asClass, asValue} from 'awilix';
import Axios from 'axios';
import config from 'config';
import {AuthedRequest} from '../../types/AuthedRequest';
// eslint-disable-next-line @typescript-eslint/camelcase
import jwt_decode from 'jwt-decode';
import {Api} from '../../Api';

export class OidcMiddleware {

  public enableFor(app: Application): void {
    const idamPublicUrl: string = config.get('services.idam.url.public');
    const authorizationURL: string = idamPublicUrl + config.get('services.idam.endpoint.authorization');
    const tokenUrl: string = idamPublicUrl + config.get('services.idam.endpoint.token');
    const clientId: string = config.get('services.idam.clientID');
    const clientSecret: string = config.get('services.idam.clientSecret');
    const redirectUri: string = config.get('services.idam.callbackURL');
    const responseType: string = config.get('services.idam.responseType');
    const scope: string = config.get('services.idam.scope');

    app.get('/login', (req: Request, res: Response) => {
      // Redirect to IDAM web public to get the authorization code
      res.redirect(`${config.get('services.idam.url.public')}${authorizationURL}?client_id=${clientId}&response_type=${responseType}&redirect_uri=${encodeURI(redirectUri)}&scope=${encodeURIComponent(scope)}`);
    });

    app.get('/oauth2/callback', async (req: Request, res: Response) => {
      // Get access token from IDAM using the authorization code
      const response = await Axios.post(
        config.get('services.idam.url.public') + tokenUrl,
        `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&redirect_uri=${encodeURI(redirectUri)}&code=${encodeURIComponent(req.query.code as string)}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      req.session.user = response.data;
      req.session.user.jwt = jwt_decode(response.data.id_token);
      res.render('redirect');
    });

    app.use((req: AuthedRequest, res: Response, next: NextFunction) => {
      if (req.session.user) {
        this.configureApiAuthorization(req);
        res.locals.isLoggedIn = true;
        return next();
      }

      if (req.xhr) {
        res.status(302).send({ url: '/login' });
      } else {
        res.redirect('/login');
      }
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
