import { AxiosInstance } from 'axios';
import { User } from './interfaces/User';
import { Logger } from './interfaces/Logger';

export class Api {
  constructor(
    private readonly axios: AxiosInstance,
    private readonly logger: Logger
  ) { }

  public getUsersByEmail(email: string): Promise<User[]> {
    return this.axios
      .get('/api/v1/users', { params: { 'query': 'email:' + email } })
      .then(results => results.data)
      .catch(error => {
        this.logger.error(`${error.stack || error}`);
        return [];
      });
  }
}
