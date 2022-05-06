import { Application } from 'express';
import config from 'config';
const { auth } = require('express-openid-connect');

export class OidcMiddleware {
  private readonly clientId: string = config.get('services.idam.clientID');
  private readonly clientSecret: string = config.get('services.idam.clientSecret');
  private readonly clientScope: string = config.get('services.idam.scope');
  private readonly baseUrl: string = config.get('services.idam.url.dashboard');
  private readonly idamBaseUrl: string = config.get('services.idam.url.public');
  private readonly sessionSecret: string = config.get('session.secret');

  public enableFor(app: Application): void {
    app.use(
      auth({
        issuerBaseURL: this.idamBaseUrl + '/o',
        baseURL: this.baseUrl,
        clientID: this.clientId,
        secret: this.sessionSecret,
        clientSecret: this.clientSecret,
        authorizationParams: {
          'response_type': 'code',
          scope: this.clientScope
        }
      })
    );
  }
}
