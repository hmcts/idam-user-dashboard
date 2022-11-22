import { IdamAPI } from '../../../../../main/app/idam-api/IdamAPI';
import {SearchType} from '../../../../../main/utils/SearchType';
import { Role } from '../../../../../main/interfaces/Role';
import { when } from 'jest-when';

describe('IdamAPI', () => {
  const testEmail = 'test@test.com';
  const testUserId = '12345';
  const testSsoId = '23456';

  const parameters = [
    { input: testEmail, searchType: SearchType.Email },
    { input: testUserId, searchType: SearchType.UserId },
    { input: testSsoId, searchType: SearchType.SsoId }
  ];

  describe('searchUsersByEmail', () => {
    parameters.forEach((parameter) => {
      it(`Should return results from getUserDetails request using ${parameter.searchType}`, async () => {
        const results = {
          data: [{
            id: testUserId,
            forename: 'test',
            surname: 'test',
            email: testEmail,
            active: true,
            roles: ['IDAM_SUPER_USER'],
            ssoId: testSsoId
          }]
        };
        const mockAxios = {get: async () => results} as any;
        const mockLogger = {} as any;
        const mockTelemetryClient = {} as any;
        const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

        await expect(api.searchUsersByEmail(parameter.input)).resolves.toEqual(results.data);
      });
    });

    test('Should not return results from getUserDetails request if error', async () => {
      const mockAxios = { get: async () => { throw new Error ('error'); } } as any;
      const mockLogger = { error: jest.fn() } as any;
      const mockTelemetryClient = { trackTrace: jest.fn() } as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.searchUsersByEmail('')).rejects.toEqual('Error retrieving user by email from IDAM API');
    });
  });

  describe('searchUsersBySsoId', () => {
    test('Should return user details using valid SSO ID', () => {
      const results = {
        data: [{
          id: testUserId,
          forename: 'test',
          surname: 'test',
          email: testEmail,
          active: true,
          roles: ['IDAM_SUPER_USER'],
          ssoId: testSsoId
        }]
      };
      const mockAxios = {get: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.searchUsersBySsoId(testSsoId)).resolves.toEqual(results.data);
    });

    test('Should not return user details when using invalid SSO ID', () => {
      const mockAxios = {get: () => Promise.reject('')} as any;
      const mockLogger = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        error : () => {}
      } as any;
      const mockTelemetryClient = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        trackTrace : () => {}
      } as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.searchUsersBySsoId('')).rejects.toEqual('Error retrieving user by ssoId from IDAM API');
    });
  });

  describe('getUserById', () => {
    test('Should return user details using valid ID', () => {
      const results = {
        data: [{
          id: testUserId,
          forename: 'test',
          surname: 'test',
          email: testEmail,
          active: true,
          roles: ['IDAM_SUPER_USER'],
          ssoId: testSsoId
        }]
      };
      const mockAxios = {get: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.getUserById(testUserId)).resolves.toEqual(results.data);
    });

    test('Should not return user details when using invalid ID', () => {
      const mockAxios = {get: () => Promise.reject('')} as any;
      const mockLogger = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        error : () => {}
      } as any;
      const mockTelemetryClient = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        trackTrace : () => {}
      } as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.getUserById('')).rejects.toEqual('Error retrieving user by ID from IDAM API');
    });
  });

  describe('getAllRoles', () => {
    test('Should return all users', () => {
      const results = {
        data: [
          {
            id: '1',
            name: 'test-role-1',
            assignableRoles: ['test-role-1', 'test-role-2']
          },
          {
            id: '2',
            name: 'test-role-2',
            assignableRoles: ['test-role-2']
          },
          {
            id: '3',
            name: 'test-role-3',
            assignableRoles: ['test-role-3', 'test-role-1']
          }
        ]
      };
      const mockAxios = {get: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.getAllRoles()).resolves.toEqual(results.data);
    });

    test('Should return error if API issue', async () => {
      const mockAxios = {get: () => Promise.reject('')} as any;
      const mockLogger = {error: jest.fn()} as any;
      const mockTelemetryClient = {trackTrace: jest.fn()} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      await expect(api.getAllRoles()).rejects.toThrowError();
      expect(mockLogger.error).toBeCalled();
    });
  });

  describe('getAssignableRoles', () => {
    test('Should return all the assignable roles for a role', () => {
      const getAllRolesMockResponse: Partial<Role>[] = [
        { id: '1', name: 'test-role-1', assignableRoles: ['1', '2'] },
        { id: '2', name: 'test-role-2', assignableRoles: ['2'] },
        { id: '3', name: 'test-role-3', assignableRoles: ['3', '1'] },
        { id: '4', name: 'test-role-4', assignableRoles: ['4', '1'] }
      ];
      const results = ['test-role-3', 'test-role-1'];

      const mockAxios = {get: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);
      api.getAllRoles = jest.fn();

      when(api.getAllRoles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as Role[]));
      expect(api.getAssignableRoles(['test-role-3'])).resolves.toEqual(results);
      expect(api.getAllRoles).toBeCalledTimes(1);
    });

    test('Should return all the assignable roles for a set of roles', () => {
      const getAllRolesMockResponse: Partial<Role>[] = [
        { id: '1', name: 'test-role-1', assignableRoles: ['1', '2'] },
        { id: '2', name: 'test-role-2', assignableRoles: ['2'] },
        { id: '3', name: 'test-role-3', assignableRoles: ['3', '1'] },
        { id: '4', name: 'test-role-4', assignableRoles: ['4', '1'] },
        { id: '5', name: 'test-role-5', assignableRoles: ['5'] },
        { id: '6', name: 'test-role-6', assignableRoles: ['6', '2', '5'] },
        { id: '7', name: 'test-role-7', assignableRoles: ['7'] },
        { id: '8', name: 'test-role-8', assignableRoles: ['9'] },
        { id: '9', name: 'test-role-9', assignableRoles: [] }
      ];
      const results = ['test-role-3', 'test-role-1', 'test-role-6', 'test-role-2', 'test-role-5', 'test-role-9'];

      const mockAxios = {get: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);
      api.getAllRoles = jest.fn();

      when(api.getAllRoles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as Role[]));
      expect(api.getAssignableRoles(['test-role-3', 'test-role-6', 'test-role-8'])).resolves.toEqual(results);
      expect(api.getAllRoles).toBeCalledTimes(1);
    });

    test('Should return only itself as assignable role if no other assignable roles', () => {
      const getAllRolesMockResponse: Partial<Role>[] = [
        { id: '1', name: 'test-role-1', assignableRoles: ['1', '2'] },
        { id: '2', name: 'test-role-2', assignableRoles: ['2'] },
      ];
      const results = ['test-role-2'];

      const mockAxios = {get: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);
      api.getAllRoles = jest.fn();

      when(api.getAllRoles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as Role[]));
      expect(api.getAssignableRoles(['test-role-2'])).resolves.toEqual(results);
      expect(api.getAllRoles).toBeCalledTimes(1);
    });

    test('Should return empty if no assignable roles or role undefined', () => {
      const getAllRolesMockResponse: Partial<Role>[] = [
        { id: '1', name: 'test-role-1', assignableRoles: ['1', '2'] },
        { id: '2', name: 'test-role-2', assignableRoles: [] },
        { id: '3', name: 'test-role-3' },
        undefined as unknown as Role
      ];

      const mockAxios = {get: async () => jest.fn()} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);
      api.getAllRoles = jest.fn();

      when(api.getAllRoles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as Role[]));
      expect(api.getAssignableRoles(['test-role-2', 'test-role-3'])).resolves.toEqual([]);
      expect(api.getAllRoles).toBeCalledTimes(1);
    });
  });

  describe('editUserById', () => {
    test('Should return updated user details using valid ID', () => {
      const fields = {
        forename: 'test changed',
        surname: 'test changed',
      };
      const results = {
        data: [{
          id: testUserId,
          ...fields,
          email: testEmail,
          active: true,
          roles: ['IDAM_SUPER_USER'],
          ssoId: testSsoId
        }]
      };
      const mockAxios = {patch: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.editUserById(testUserId, fields)).resolves.toEqual(results.data);
    });

    test('Should not return updated user details when error', () => {
      const fields = {
        forename: 'test changed',
        surname: 'test changed',
      };
      const mockAxios = {patch: () => Promise.reject('')} as any;
      const mockLogger = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        error : () => {}
      } as any;
      const mockTelemetryClient = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        trackTrace : () => {}
      } as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.editUserById(testUserId, fields)).rejects.toEqual('Error patching user details in IDAM API');
    });
  });

  describe('deleteUserById', () => {
    test('Should delete user using valid user ID', async () => {
      const mockAxios = {delete: jest.fn().mockReturnValue(Promise.resolve())} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      await expect(api.deleteUserById(testUserId)).resolves.not.toThrow();
      expect(mockAxios.delete).toBeCalledWith('/api/v1/users/12345');
    });

    test('Should not return user details when using invalid ID', async () => {
      const mockAxios = {delete: jest.fn().mockReturnValue(Promise.reject('Delete failed'))} as any;
      const mockLogger = {error: jest.fn()} as any;
      const mockTelemetryClient = {trackTrace: jest.fn()} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      await expect(api.deleteUserById('-1')).rejects.toThrowError('Error deleting user by ID from IDAM API');
      expect(mockAxios.delete).toBeCalledWith('/api/v1/users/-1');
      expect(mockLogger.error).toBeCalledWith('Delete failed');
    });
  });

  describe('registerUser', () => {
    const input = {
      email: testEmail,
      firstName: 'firstName',
      lastName: 'lastName',
      roles: ['IDAM_SUPER_USER']
    };

    test('Should register a new user', () => {
      const testValue = 1;
      const result = {data: testValue};
      const mockAxios = {post: async () => Promise.resolve(result)} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.registerUser(input)).resolves.toEqual(testValue);
    });

    test('Should not register a user when error', () => {
      const mockAxios = {post: () => Promise.reject('')} as any;
      const mockLogger = {
        error: jest.fn()
      } as any;
      const mockTelemetryClient = {
        trackTrace: jest.fn()
      } as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.registerUser(input)).rejects.toEqual('Error register new user in IDAM API');
    });
  });

  describe('getAllServices', () => {
    const results = {
      data: [
        {
          label: 'service A',
          description: 'service A description'
        },
        {
          label: 'service B',
          description: 'service B description'
        }
      ]
    };

    test('Should get all services', () => {
      const mockAxios = {get: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.getAllServices()).resolves.toEqual(results.data);
    });

    test('Should not get services when error', () => {
      const mockAxios = {get: () => Promise.reject('')} as any;
      const mockLogger = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        error : () => {}
      } as any;
      const mockTelemetryClient = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        trackTrace : () => {}
      } as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.getAllServices()).rejects.toEqual('Error retrieving all services from IDAM API');
    });
  });

  describe('grantRolesToUser', () => {
    const roleDefinitions = [
      {
        name: 'role1'
      },
      {
        name: 'role2'
      }
    ];

    test('Should grant roles to user', () => {
      const testValue = 1;
      const result = {data: testValue};
      const mockAxios = {post: async () => Promise.resolve(result)} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.grantRolesToUser(testUserId, roleDefinitions)).resolves.toEqual(testValue);
    });

    test('Should not grant roles to user when error', () => {
      const mockAxios = {post: () => Promise.reject('')} as any;
      const mockLogger = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        error : () => {}
      } as any;
      const mockTelemetryClient = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        trackTrace : () => {}
      } as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.grantRolesToUser(testUserId, roleDefinitions)).rejects.toEqual('Error granting user roles in IDAM API');
    });
  });

  describe('removeRoleFromUser', () => {
    test('Should remove roles from user', () => {
      const testValue = 1;
      const result = {data: testValue};
      const mockAxios = {delete: async () => Promise.resolve(result)} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.removeRoleFromUser(testUserId, 'role1')).resolves.toEqual(testValue);
    });

    test('Should not remove roles from user when error', () => {
      const mockAxios = {delete: () => Promise.reject('')} as any;
      const mockLogger = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        error : () => {}
      } as any;
      const mockTelemetryClient = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        trackTrace : () => {}
      } as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.removeRoleFromUser(testUserId, 'role1')).rejects.toEqual('Error deleting user role in IDAM API');
    });
  });

  describe('getUsersWithRoles', () => {
    test('Should return users details when querying by single role', () => {
      const results = {
        data: [{
          id: testUserId,
          forename: 'test',
          surname: 'test',
          email: testEmail,
          active: true,
          roles: ['IDAM_SUPER_USER'],
        },
        {
          id: testUserId + 1,
          forename: 'test',
          surname: 'test',
          email: '2' + testEmail,
          active: true,
          roles: ['IDAM_SUPER_USER'],
        }]
      };
      const roles = ['IDAM_SUPER_USER'];
      const expectedAxiosCall = '/api/v1/users?size=500&query=(roles:IDAM_SUPER_USER) AND lastModified:>2018-01-01T00:00:00.000000';

      const mockAxios: any = { get: jest.fn().mockResolvedValue(results) };
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.getUsersWithRoles(roles)).resolves.toEqual(results.data);
      expect(mockAxios.get).toBeCalledWith(expectedAxiosCall, {'timeout': 20000});
    });

    test('Should return users details when querying by multiple roles', () => {
      const results = {
        data: [{
          id: testUserId,
          forename: 'test',
          surname: 'test',
          email: testEmail,
          active: true,
          roles: ['IDAM_SUPER_USER'],
        },
        {
          id: testUserId + 1,
          forename: 'test',
          surname: 'test',
          email: '2' + testEmail,
          active: true,
          roles: ['IDAM_ADMIN_USER'],
        }]
      };
      const roles = ['IDAM_SUPER_USER', 'IDAM_ADMIN_USER'];
      const expectedAxiosCall = '/api/v1/users?size=500&query=(roles:IDAM_SUPER_USER OR roles:IDAM_ADMIN_USER) AND lastModified:>2018-01-01T00:00:00.000000';

      const mockAxios: any = { get: jest.fn().mockResolvedValue(results) };
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      expect(api.getUsersWithRoles(roles)).resolves.toEqual(results.data);
      expect(mockAxios.get).toBeCalledWith(expectedAxiosCall, {'timeout': 20000});
    });

    test('Should return error if API issue', async () => {
      const roles = ['IDAM_SUPER_USER'];

      const mockAxios: any = {get: jest.fn().mockRejectedValue('')};
      const mockLogger = {error: jest.fn()} as any;
      const mockTelemetryClient = {trackTrace: jest.fn()} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

      await expect(api.getUsersWithRoles(roles)).rejects.toThrowError();
      expect(mockLogger.error).toBeCalled();
    });
  });
});
