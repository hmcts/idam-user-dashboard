import { User } from '../../interfaces/User';
import Axios from 'axios';
import config from 'config';
import jwtDecode from 'jwt-decode';
import { Logger } from '../../interfaces/Logger';
import { HTTPError } from '../errors/HttpError';
import { constants as http } from 'http2';
import { OIDCToken } from './OIDCToken';
import axios from 'axios';
import { TelemetryClient } from 'applicationinsights';

export enum IdamGrantType {
  AUTH_CODE = 'authorization_code',
  REFRESH = 'refresh_token',
  PASSWORD = 'password'
}

export type OIDCSession = {
  user: Partial<User>;
  tokens: {
    accessToken: OIDCToken;
    refreshToken: OIDCToken;
  };
}

interface IdToken {
  uid: string;
  given_name: string;
  family_name: string;
  sub: string;
  roles: string[];
}

export class IdamAuth {
  private readonly IDAM_PUBLIC_URL: string = config.get('services.idam.url.public');
  private readonly CALLBACK_URL: string = config.get('services.idam.callbackURL');
  private readonly TOKEN_PATH: string = config.get('services.idam.endpoint.token');
  private readonly AUTHORIZATION_PATH: string = config.get('services.idam.endpoint.authorization');


  constructor(
    private readonly logger: Logger,
    private readonly telemetryClient: TelemetryClient,
    private readonly clientId = config.get('services.idam.clientID') as string,
    private readonly clientSecret = config.get('services.idam.clientSecret') as string,
    private readonly clientScope = config.get('services.idam.scope') as string,
    private readonly axios = Axios.create({ baseURL: config.get('services.idam.url.api') })
  ) { }

  public getAuthorizeRedirect() {
    const URL = this.IDAM_PUBLIC_URL + this.AUTHORIZATION_PATH;
    const params = new URLSearchParams({
      'client_id': this.clientId,
      'response_type': 'code',
      'redirect_uri': this.CALLBACK_URL,
      'scope': this.clientScope
    });

    return URL + '?' + params.toString() +'&prompt=login';
  }

  public authorizeCode(code: string): Promise<OIDCSession> {
    return this.authorize(IdamGrantType.AUTH_CODE, { code });
  }

  public authorizePassword(username: string, password: string): Promise<OIDCSession> {
    return this.authorize(IdamGrantType.PASSWORD, { username, password, scope: this.clientScope });
  }

  public authorizeRefresh(refreshToken: string): Promise<OIDCSession> {
    return this.authorize(IdamGrantType.REFRESH, { 'refresh_token': refreshToken });
  }

  private authorize(grantType: IdamGrantType, params: object): Promise<OIDCSession> {
    const defaultParams = {
      'grant_type': grantType,
      'client_id': this.clientId,
      'client_secret': this.clientSecret,
      'redirect_uri': this.CALLBACK_URL,
    };

    return this.axios.post(this.TOKEN_PATH, new URLSearchParams({ ...defaultParams, ...params }))
      .then(({ data: tokens }) => {
        return {
          user: this.convertIdTokenToUser(jwtDecode(tokens.id_token)),
          tokens: {
            accessToken: OIDCToken.format(tokens.access_token),
            refreshToken: OIDCToken.format(tokens.refresh_token)
          }};
      })
      .catch(error => {
        const message = 'Failed to sign in with the password. ' + error.response?.data?.error_description;
        this.logger.error(message);
        this.telemetryClient.trackTrace({message: message});
        throw new HTTPError(http.HTTP_STATUS_UNAUTHORIZED);
      });
  }

  private convertIdTokenToUser = (idToken: IdToken): Partial<User> => ({
    id: idToken.uid,
    forename: idToken.given_name,
    surname: idToken.family_name,
    email: idToken.sub,
    active: true,
    roles: idToken.roles,
  })

  public getUserAxios(accessToken: { raw: string }) {
    return axios.create({
      baseURL: config.get('services.idam.url.api'),
      headers: { Authorization: 'Bearer ' + accessToken.raw }
    });
  }
}
