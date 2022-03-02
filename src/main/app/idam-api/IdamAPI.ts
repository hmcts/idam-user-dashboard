import { AxiosInstance } from 'axios';
import { User } from '../../interfaces/User';
import { Logger } from '../../interfaces/Logger';
import { TelemetryClient } from 'applicationinsights';
import { Role } from '../../interfaces/Role';

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

  public getRoleByName(name: string): Promise<Role> {
    return this.axios.get('/roles/name/' + name)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving role by name from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public getAllRoles(): Promise<Role[]> {
    return this.axios.get('/roles/')
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error retrieving all roles from IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        return Promise.reject(errorMessage);
      });
  }

  public async getAssignableRoles(roleNames: string[]) {
    const rolesMap: Map<string, Role> = new Map<string, Role>();

    function traverse(collection: Role[], role: Role): Role[] {
      if(role === undefined) return collection;

      if(role.assignableRoles?.length > 1) {
        const assignableRoles = role.assignableRoles.filter(id => role.id !== id).map(id => rolesMap.get(id));
        return assignableRoles.reduce(traverse, collection);
      }

      collection.push(role);
      return collection;
    }

    return this.getAllRoles()
      // Sets up roleMap with roleid - role
      .then(roles => roles.forEach(role => rolesMap.set(role.id, role)))

      // Map given role names to roles in rolesMap and return complete role objects.
      .then(() => Array.from(rolesMap.values()).filter(value => roleNames.includes(value.name)))

      // Recursively finds each assignable role for given roles, then gets the name of each role and adds it to the array
      .then(roles => roles.flatMap(role => traverse([], role)).map(role => role.name))

      // Creates a set from the array of assignable roles to remove duplicates, then converts it back into an array (optimise somehow?)
      .then(assignableRoles => Array.from(new Set(assignableRoles)));
  }
}
