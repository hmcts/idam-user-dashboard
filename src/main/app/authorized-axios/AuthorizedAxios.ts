import axios, {Axios, AxiosRequestConfig, AxiosRequestHeaders} from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import logger from '../../modules/logging';

type Token = {
  raw: string;
  decoded: JwtPayload & { expires_in: number };
};

type PartialOAuthConfig = {
  clientId: string;
  clientSecret: string;
  clientScope: string;
  tokenEndpoint?: string;
  idpBaseUrl?: string;
  autoRefresh?: boolean;
};

type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  clientScope: string;
  tokenEndpoint: string;
  idpBaseUrl: string;
  autoRefresh: boolean;
};

type AuthorizedAxiosParams = AxiosRequestConfig & { oauth: PartialOAuthConfig };

export class AuthorizedAxios extends Axios {
  private oauth: OAuthConfig & { token?: Token };
  private timeoutFunc: NodeJS.Timeout;

  constructor(config: AuthorizedAxiosParams) {
    super({
      ...(axios.defaults as unknown as AxiosRequestConfig),
      ...config,
    });

    this.setOAuthConfig(config.oauth);
    this.requestInterceptor();
    this.responseInterceptor();

    if (this.oauth.autoRefresh) {
      this.autoRefresh();
    }
  }

  public setToken = (encodedToken: string): void => {
    this.oauth.token = {
      raw: encodedToken,
      decoded: jwtDecode<Token['decoded']>(encodedToken),
    };
  };

  public setOAuthConfig = (oauthConfig: PartialOAuthConfig): void => {
    this.oauth = {
      clientId: oauthConfig.clientId,
      clientSecret: oauthConfig.clientSecret,
      clientScope: oauthConfig.clientScope,
      idpBaseUrl: oauthConfig.idpBaseUrl || this.defaults.baseURL || '',
      tokenEndpoint: oauthConfig.tokenEndpoint || '/o/token',
      autoRefresh: oauthConfig.autoRefresh || false,
    };
  };

  public refreshToken = (): Promise<void> => {
    if (!this.oauth) {
      throw new Error('Missing oauth configuration');
    }

    return this.post(
      this.oauth.idpBaseUrl + this.oauth.tokenEndpoint,
      new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': this.oauth.clientId,
        'client_secret': this.oauth.clientSecret,
        scope: this.oauth.clientScope,
      })
    ).then(response => this.setToken(response.data.access_token))
      .catch(e => {
        logger.error('Failed to get token - ' + e);
        throw e;
      });
  };

  private autoRefresh = () => {
    const errorIntervalRate = 60;
    let intervalRate: number;

    const intervalFunc = () => {
      this.refreshToken()
        .then(() => {
          intervalRate = this.oauth.token?.decoded.expires_in / 2;
        })
        .catch(e => {
          logger.error('Failed to authenticate - ' + e);
          intervalRate = errorIntervalRate;
        })
        .finally(() => {
          logger.error('Authenticated ' + this.oauth.clientId + ' will authenticate again in: ' + intervalRate + ' seconds.');
          this.timeoutFunc = setTimeout(intervalFunc, intervalRate * 1000);
        });
    };

    intervalFunc();
  };

  private requestInterceptor = () => {
    this.interceptors.request.use(config => {
      if (this.oauth.token && !config.url?.endsWith('/o/token')) {
        config.headers = config.headers ?? {} as AxiosRequestHeaders;
        if (this.oauth.token.raw) {
          config.headers.Authorization = 'Bearer ' + this.oauth.token.raw;
        } else {
          logger.error('skipped adding bearer, token is empty');
        }
      }
      return config;
    });
  };

  private responseInterceptor = () => {
    this.interceptors.response.use(
      response => response,
      error => {
        if (error?.response?.status === 401) {
          logger.info('Attempting token refresh and retry of request');
          return this.refreshToken().then(() => this.request(error.config))
            .catch(e => {
              logger.error('Interceptor failed to refresh - ' + e);
              throw e;
            });
        }
        if (error?.response) {
          logger.error('axios failed, response code ' + error.response.status + ', ' + JSON.stringify(error.response.data));
        }
        return Promise.reject(error);
      }
    );
  };

  public close = () => {
    clearTimeout(this.timeoutFunc);
  };
}
