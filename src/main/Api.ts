import { AxiosInstance } from 'axios';
import { User } from './interfaces/User';

export class Api {
  constructor(
    private readonly axios: AxiosInstance
  ) { }

  public getUsersByEmail(email: string): Promise<User[]> {
    return this.axios
      .get('/api/v1/users', { params: { 'query': 'email:' + email } })
      .then(results => results.data)
      .catch(err => {
        return [];
      });
  }
}
