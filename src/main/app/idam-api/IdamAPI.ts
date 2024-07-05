import { AxiosInstance } from 'axios';
import { User } from '../../interfaces/User';
import { TelemetryClient } from 'applicationinsights';
import { Role } from '../../interfaces/Role';
import { HTTPError } from '../errors/HttpError';
import { constants as http } from 'http2';
import { UserRegistrationDetails } from '../../interfaces/UserRegistrationDetails';
import { Service } from '../../interfaces/Service';
import { SearchType } from '../../utils/SearchType';
import { RoleDefinition } from '../../interfaces/RoleDefinition';
import { ROLE_PERMISSION_ERROR } from '../../utils/error';
import { V2User } from '../../interfaces/V2User';

export class IdamAPI {
  constructor(
    private readonly userAxios: AxiosInstance,
    private readonly systemAxios: AxiosInstance,
    private readonly clientAxios: AxiosInstance,
    private readonly idamApiAxios: AxiosInstance,
    private readonly logger: any,
    private readonly telemetryClient: TelemetryClient
  ) { }

  private getUserDetails(type: string, query: string): Promise<User[]> {
    return this.userAxios
      .get('/api/v1/users', { params: { 'query': `${type}:` + query } })
      .then(results => results.data)
      .catch(error => {
        const errorMessage = `Error retrieving user by ${type} from IDAM API for query ${query}`;
        this.telemetryClient.trackTrace({message: errorMessage + ' trackTrace'});
        this.logger.error(`${error.stack || error} logger.error`);
        return Promise.reject(errorMessage);
      });
  }

  public searchUsersByEmail(email: string): Promise<User[]> {
    return this.getUserDetails(SearchType.Email, email);
  }

  public searchUsersBySsoId(id: string): Promise<User[]> {
    return this.getUserDetails(SearchType.SsoId, id);
  }

  public getUserById(id: string): Promise<User> {
    return this.userAxios
      .get('/api/v1/users/' + id)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving user by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public getUserV2ById(id: string): Promise<V2User> {
    return this.clientAxios
      .get('/api/v2/users/' + id)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving user by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public editUserById(id: string, fields: Partial<User>): Promise<User> {
    return this.userAxios
      .patch('/api/v1/users/' + id, fields)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error patching user details in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public deleteUserById(id: string) {
    return this.idamApiAxios
      .delete('/api/v2/users/' + id)
      .catch(error => {
        const errorMessage = 'Error deleting user by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        throw new Error(errorMessage);
      });
  }

  public removeSsoById(id: string) {
    return this.userAxios
      .delete('/api/v1/users/' + id + '/sso')
      .catch(error => {
        const errorMessage = 'Error removing user SSO by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        throw new Error(errorMessage);
      });
  }

  public registerUser(user: UserRegistrationDetails): Promise<void> {
    return this.userAxios
      .post('/api/v1/users/registration', user)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = error.response?.status === 403 ? ROLE_PERMISSION_ERROR :'Error register new user in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public getAllServices(): Promise<Service[]> {
    return this.userAxios
      .get('/services')
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving all services from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public getAllRoles(): Promise<Role[]> {
    return this.systemAxios
      .get('/roles/')
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving all roles from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        throw new HTTPError(http.HTTP_STATUS_INTERNAL_SERVER_ERROR);
      });
  }

  public async getAssignableRoles(roleNames: string[]) {
    const allRoles = await this.getAllRoles();
    const rolesMap = new Map(allRoles
      .filter(role => role !== undefined)
      .map(role => [role.id, role])
    );

    const collection: Set<string> = new Set();
    Array.from(rolesMap.values())
      .filter(role => roleNames.includes(role.name))
      .filter(role => Array.isArray(role.assignableRoles))
      .forEach(role => role.assignableRoles
        .filter(r => rolesMap.has(r))
        .forEach(r => collection.add(rolesMap.get(r).name))
      );

    return Array.from(collection);
  }

  public grantRolesToUser(id: string, roleDefinitions: RoleDefinition[]): Promise<void> {
    return this.userAxios
      .post('/api/v1/users/' + id + '/roles', roleDefinitions)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error granting user roles in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public removeRoleFromUser(id: string, roleName: string): Promise<void> {
    return this.userAxios
      .delete('/api/v1/users/' + id + '/roles/' + roleName)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error deleting user role in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public getUsersWithRoles(roles: string[], size: number = 20, page: number = 0): Promise<User[]> {
    let queryString = '';
    roles.forEach((role, index, roles) => {
      queryString += 'roles:' + role;
      if (index !== roles.length - 1) {
        queryString += ' OR ';
      }
    });

    return this.userAxios
      .get(`/api/v1/users?size=${size}&page=${page}&query=(${queryString})`,
        {
          timeout: 20000
        })
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error getting all users with role from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        throw new Error(errorMessage);
      });
  }
}
