import axios, {Axios, AxiosRequestConfig, AxiosRequestHeaders} from 'axios';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { TelemetryClient } from 'applicationinsights';

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

  constructor(config: AuthorizedAxiosParams, private readonly telemetryClient: TelemetryClient) {
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
    ).then(response => this.setToken(response.data.access_token));
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
          console.log('(console) Failed to authenticate - ' + e);
          intervalRate = errorIntervalRate;
        })
        .finally(() => {
          console.log('(console) Authenticated ' + this.oauth.clientId + ' will authenticate again in: ' + intervalRate + ' seconds.');
          this.timeoutFunc = setTimeout(intervalFunc, intervalRate * 1000);
        });
    };

    intervalFunc();
  };

  private requestInterceptor = () => {
    this.interceptors.request.use(config => {
      if (this.oauth.token && !config.url?.endsWith('/o/token')) {
        config.headers = config.headers ?? {} as AxiosRequestHeaders;
        config.headers.Authorization = 'Bearer ' + this.oauth.token.raw;
      }
      return config;
    });
  };

  private responseInterceptor = () => {
    this.interceptors.response.use(
      response => response,
      error => {
        if (error?.response?.status === 401) {
          return this.refreshToken().then(() => this.request(error.config));
        }
        if (error?.response) {
          console.log('axios failed, response code ' + error.response.status + ', ' + JSON.stringify(error.response.data));
          this.telemetryClient.trackException({exception: error});
        }
        return Promise.reject(error);
      }
    );
  };

  public close = () => {
    clearTimeout(this.timeoutFunc);
  };
}
