import Axios, { AxiosInstance } from 'axios';
import { User } from '../../interfaces/User';
import { Logger } from '../../interfaces/Logger';
import { TelemetryClient } from 'applicationinsights';
import config from 'config';

export class IdamApi {
  private readonly axios: AxiosInstance = Axios.create({ baseURL: config.get('services.idam.url.api') });

  constructor(
    private readonly logger: Logger,
    private readonly telemetryClient: TelemetryClient,
  ) {}

  public configureApiAuthorization(accessToken: string): void {
    this.axios.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
  }

  public getUsersByEmail(email: string): Promise<User[]> {
    return this.axios
      .get('/api/v1/users', { params: { 'query': 'email:' + email } })
      .then(results => results.data)
      .catch(error => {
        this.telemetryClient.trackTrace({message: 'Error retrieving user e-mail from IDAM API'});
        this.logger.error(`${error.stack || error}`);
        return [];
      });
  }
}
