import { IdamAPI } from '../../../../../main/app/idam-api/IdamAPI';
import {SearchType} from '../../../../../main/utils/SearchType';
import { Role } from '../../../../../main/interfaces/Role';
import { when } from 'jest-when';

describe('IdamAPI', () => {
  const testEmail = 'test@test.com';
  const testUserId = '12345';
  const testSsoId = '23456';

  const parameters = [
    { input: testEmail, searchType: SearchType['Email'] },
    { input: testUserId, searchType: SearchType['UserId'] },
    { input: testSsoId, searchType: SearchType['SsoId'] }
  ];

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

      await expect(api.getUserDetails(parameter.searchType, parameter.input)).resolves.toEqual(results.data);
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
      const results = ['test-role-3', 'test-role-1', 'test-role-2'];

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
        { id: '7', name: 'test-role-7', assignableRoles: ['7'] }
      ];
      const results = ['test-role-3', 'test-role-1', 'test-role-2', 'test-role-6', 'test-role-5'];

      const mockAxios = {get: async () => results} as any;
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);
      api.getAllRoles = jest.fn();

      when(api.getAllRoles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as Role[]));
      expect(api.getAssignableRoles(['test-role-3', 'test-role-6'])).resolves.toEqual(results);
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

  test('Should not return results from getUserDetails request if error', async () => {
    const mockAxios = { get: async () => { throw new Error ('error'); } } as any;
    const mockLogger = { error: jest.fn() } as any;
    const mockTelemetryClient = { trackTrace: jest.fn() } as any;
    const api = new IdamAPI(mockAxios, mockAxios, mockLogger, mockTelemetryClient);

    await expect(api.getUserDetails(SearchType['Email'], testEmail)).resolves.toEqual([]);
  });
});
