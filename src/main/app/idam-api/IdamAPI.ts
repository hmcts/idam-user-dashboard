import { AxiosInstance } from 'axios';
import { User } from '../../interfaces/User';
import { Logger } from '../../interfaces/Logger';
import { TelemetryClient } from 'applicationinsights';

export class IdamAPI {
  constructor(
    private readonly axios: AxiosInstance,
    private readonly logger: Logger,
    private readonly telemetryClient: TelemetryClient
  ) { }

  public getUserDetails(type: string, query: string): Promise<User[]> {
    return this.axios
      .get('/api/v1/users', { params: { 'query': `${type}:` + query } })
      .then(results => results.data)
      .catch(error => {
        this.telemetryClient.trackTrace({message: 'Error retrieving user details from IDAM API'});
        this.logger.error(`${error.stack || error}`);
        return [];
      });
  }
}
