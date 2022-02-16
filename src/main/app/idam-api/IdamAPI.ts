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
