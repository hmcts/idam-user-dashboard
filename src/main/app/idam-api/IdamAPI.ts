import { AxiosInstance } from 'axios';
import { User } from '../../interfaces/User';
import { TelemetryClient } from 'applicationinsights';
import { V2Role } from '../../interfaces/V2Role';
import { HTTPError } from '../errors/HttpError';
import { constants as http } from 'http2';
import { UserRegistrationDetails } from '../../interfaces/UserRegistrationDetails';
import { Service } from '../../interfaces/Service';
import { SearchType } from '../../utils/SearchType';
import { RoleDefinition } from '../../interfaces/RoleDefinition';
import { ROLE_PERMISSION_ERROR } from '../../utils/error';
import { V2User } from '../../interfaces/V2User';
import logger from '../../modules/logging';

export class IdamAPI {
  constructor(
    private readonly idamApiAxios: AxiosInstance,
    private readonly simpleAxios: AxiosInstance,
    private readonly telemetryClient: TelemetryClient
  ) { }

  private getUserDetails(token: string, type: string, query: string): Promise<User[]> {
    return this.simpleAxios
      .get('/api/v1/users', {headers: {Authorization: 'Bearer ' + token}, params: { 'query': `${type}:` + query } })
      .then(results => results.data)
      .catch(error => {
        const errorMessage = `Error retrieving user by ${type} from IDAM API`;
        this.telemetryClient.trackTrace({message: errorMessage + ' for query ' + query + ' (trackTrace)'});
        logger.error(`${error.stack || error} for query ${query} (logger.error)`);
        return Promise.reject(errorMessage);
      });
  }

  public searchUsersByEmail(token: string, email: string): Promise<User[]> {
    return this.getUserDetails(token, SearchType.Email, email);
  }

  public searchUsersBySsoId(token: string, id: string): Promise<User[]> {
    return this.getUserDetails(token, SearchType.SsoId, id);
  }

  public getUserById(token: string, id: string): Promise<User> {
    return this.simpleAxios
      .get('/api/v1/users/' + id, {headers: {Authorization: 'Bearer ' + token}})
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving user by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage + ' for id ' + id + ' (trackTrace)'});
        logger.error(`${error.stack || error} for ${id} (logger.error)`);
        return Promise.reject(errorMessage);
      });
  }

  public getUserV2ById(id: string): Promise<V2User> {
    return this.idamApiAxios
      .get('/api/v2/users/' + id)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving user by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage + ' for id ' + id + ' (trackTrace) v2'});
        logger.error(`${error.stack || error} for ${id} (logger.error)`);
        return Promise.reject(errorMessage);
      });
  }

  public editUserById(token: string, id: string, fields: Partial<User>): Promise<User> {
    return this.simpleAxios
      .patch('/api/v1/users/' + id, fields, {headers: {Authorization: 'Bearer ' + token}})
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error patching user details in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public deleteUserById(id: string) {
    return this.idamApiAxios
      .delete('/api/v2/users/' + id)
      .catch(error => {
        const errorMessage = 'Error deleting user by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        throw new Error(errorMessage);
      });
  }

  public removeSsoById(token: string, id: string) {
    return this.simpleAxios
      .delete('/api/v1/users/' + id + '/sso', {headers: {Authorization: 'Bearer ' + token}})
      .catch(error => {
        const errorMessage = 'Error removing user SSO by ID from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        throw new Error(errorMessage);
      });
  }

  public registerUser(token: string, user: UserRegistrationDetails): Promise<void> {
    return this.simpleAxios
      .post('/api/v1/users/registration', user, {headers: {Authorization: 'Bearer ' + token}})
      .then(results => results.data)
      .catch(error => {
        const errorMessage = error.response?.status === 403 ? ROLE_PERMISSION_ERROR :'Error register new user in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public getAllServices(): Promise<Service[]> {
    return this.simpleAxios
      .get('/services')
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving all services from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public getAllV2Roles(): Promise<V2Role[]> {
    return this.idamApiAxios
      .get('/api/v2/roles')
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving all v2 roles from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        throw new HTTPError(http.HTTP_STATUS_INTERNAL_SERVER_ERROR);
      });
  }

  public async getAssignableRoles(roleNames: string[]) {
    const allRoles = await this.getAllV2Roles();
    const rolesMap = new Map(allRoles
      .filter(role => role !== undefined)
      .map(role => [role.id, role])
    );

    const collection: Set<string> = new Set();
    Array.from(rolesMap.values())
      .filter(role => roleNames.includes(role.name))
      .filter(role => Array.isArray(role.assignableRoleNames))
      .forEach(role => role.assignableRoleNames
        .filter(r => rolesMap.has(r))
        .forEach(r => collection.add(rolesMap.get(r).name))
      );

    return Array.from(collection);
  }

  public grantRolesToUser(token: string, id: string, roleDefinitions: RoleDefinition[]): Promise<void> {
    return this.simpleAxios
      .post('/api/v1/users/' + id + '/roles', roleDefinitions, {headers: {Authorization: 'Bearer ' + token}})
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error granting user roles in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public removeRoleFromUser(token: string, id: string, roleName: string): Promise<void> {
    return this.simpleAxios
      .delete('/api/v1/users/' + id + '/roles/' + roleName, {headers: {Authorization: 'Bearer ' + token}})
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error deleting user role in IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public getUsersWithRoles(token: string, roles: string[], size: number = 20, page: number = 0): Promise<User[]> {
    let queryString = '';
    roles.forEach((role, index, roles) => {
      queryString += 'roles:' + role;
      if (index !== roles.length - 1) {
        queryString += ' OR ';
      }
    });

    return this.simpleAxios
      .get(`/api/v1/users?size=${size}&page=${page}&query=(${queryString})`,
        {
          headers: {Authorization: 'Bearer ' + token},
          timeout: 20000
        })
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error getting all users with role from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        logger.error(`${error.stack || error}`);
        throw new Error(errorMessage);
      });
  }
}
