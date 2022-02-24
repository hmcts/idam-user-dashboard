import { AxiosInstance } from 'axios';
import { User } from '../../interfaces/User';
import { Role } from '../../interfaces/Role';
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

  public getUserById(id: string): Promise<User> {
    return this.axios.get('/api/v1/users/' + id)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving user by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  //TODO: Update to V1 endpoint when released
  public getRoles(): Promise<Role[]> {
    return this.axios.get('/roles')
      .then(results =>
        (results.data as Role[]).sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1: -1)
      )
      .catch(error => {
        const errorMessage = 'Error retrieving roles from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public editUserById(id: string, fields: Partial<User>): Promise<User> {
    return this.axios
      .patch('/api/v1/users/' + id, fields)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error patching user details in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public editUserRolesById(id: string, roles: string[]): Promise<User> {
    const formattedRoles = roles.map(role => { return { name: role }; });
    return this.axios
      .put('/api/v1/users/' + id + '/roles', formattedRoles)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error patching user roles in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }
}
