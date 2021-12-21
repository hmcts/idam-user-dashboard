import { AxiosInstance } from 'axios';
import { User } from './interfaces/UserResultData';

export class Api {
  constructor(
    private readonly axios: AxiosInstance
  ) { }

  public getUsersByEmail(email: string): Promise<User[]> {
    return this.axios
      .get(`/api/v1/users?query=email:${email}`)
      .then(results => results.data)
      .catch(err => {
        return [];
      });
  }
}
