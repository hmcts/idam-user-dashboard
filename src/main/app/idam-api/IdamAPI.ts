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
    return this.userAxios
      .get('/api/v1/users', { params: { 'query': `${type}:` + query } })
      .then(results => results.data)
      .catch(error => {
        this.telemetryClient.trackTrace({message: 'Error retrieving user details from IDAM API'});
        this.logger.error(`${error.stack || error}`);
        return [];
      });
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

  public registerUser(user: UserRegistrationDetails): Promise<void> {
    return this.userAxios
      .post('/api/v1/users/registration', user)
      .then(results => results.data)
      .catch(error => {
        const errorMessage = 'Error register new user in IDAM API';
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
    const rolesMap: Map<string, Role> = new Map<string, Role>();

    function traverse(collection: Role[], role: Role): Role[] {
      if(!role.assignableRoles || !role.assignableRoles.length) return collection;

      collection.push(role);

      if(role.assignableRoles?.length > 1) {
        const assignableRoles = role.assignableRoles.filter(id => role.id !== id).map(id => rolesMap.get(id));
        return assignableRoles.reduce(traverse, collection);
      }

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
