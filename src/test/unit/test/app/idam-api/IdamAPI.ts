import { IdamAPI } from '../../../../../main/app/idam-api/IdamAPI';
import {SearchType} from '../../../../../main/utils/SearchType';
import { V2Role } from '../../../../../main/interfaces/V2Role';
import { when } from 'jest-when';

describe('IdamAPI', () => {
  const testEmail = 'test@test.com';
  const testUserId = '12345';
  const testSsoId = '23456';
  const testToken = 'test-token';

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
        
        
        const api = new IdamAPI(mockAxios, mockAxios);

        await expect(api.searchUsersByEmail(testToken, parameter.input)).resolves.toEqual(results.data);
      });
    });

    test('Should not return results from getUserDetails request if error', async () => {
      const mockAxios = { get: async () => { throw new Error ('error'); } } as any;
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.searchUsersByEmail(testToken, '')).rejects.toEqual('Error retrieving user by email from IDAM API');
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
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.searchUsersBySsoId(testToken, testSsoId)).resolves.toEqual(results.data);
    });

    test('Should not return user details when using invalid SSO ID', () => {
      const mockAxios = {get: () => Promise.reject('')} as any;
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.searchUsersBySsoId(testToken, '')).rejects.toEqual('Error retrieving user by ssoId from IDAM API');
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
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.getUserById(testToken, testUserId)).resolves.toEqual(results.data);
    });

    test('Should not return user details when using invalid ID', () => {
      const mockAxios = {get: () => Promise.reject('')} as any;
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.getUserById(testToken, '')).rejects.toEqual('Error retrieving user by ID from IDAM API');
    });
  });

  describe('getAllV2Roles', () => {
    test('Should return all users', () => {
      const results = {
        data: [
          {
            id: '1',
            name: 'test-role-1',
            assignableRoleNames: ['test-role-1', 'test-role-2']
          },
          {
            id: '2',
            name: 'test-role-2',
            assignableRoleNames: ['test-role-2']
          },
          {
            id: '3',
            name: 'test-role-3',
            assignableRoleNames: ['test-role-3', 'test-role-1']
          }
        ]
      };
      const mockAxios = {get: async () => results} as any;
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.getAllV2Roles()).resolves.toEqual(results.data);
    });

    test('Should return error if API issue', async () => {
      const mockAxios = {get: () => Promise.reject('')} as any;
      const api = new IdamAPI(mockAxios, mockAxios);

      await expect(api.getAllV2Roles()).rejects.toThrow();
    });
  });

  describe('getAssignableRoles', () => {
    test('Should return all the assignable roles for a role', () => {
      const getAllRolesMockResponse: Partial<V2Role>[] = [
        { id: '1', name: 'test-role-1', assignableRoleNames: ['1', '2'] },
        { id: '2', name: 'test-role-2', assignableRoleNames: ['2'] },
        { id: '3', name: 'test-role-3', assignableRoleNames: ['3', '1'] },
        { id: '4', name: 'test-role-4', assignableRoleNames: ['4', '1'] }
      ];
      const results = ['test-role-3', 'test-role-1'];

      const mockAxios = {get: async () => results} as any;      
      
      const api = new IdamAPI(mockAxios, mockAxios);
      api.getAllV2Roles = jest.fn();

      when(api.getAllV2Roles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as V2Role[]));
      expect(api.getAssignableRoles(['test-role-3'])).resolves.toEqual(results);
      expect(api.getAllV2Roles). toHaveBeenCalledTimes(1);
    });

    test('Should return all the assignable roles for a set of roles', () => {
      const getAllRolesMockResponse: Partial<V2Role>[] = [
        { id: '1', name: 'test-role-1', assignableRoleNames: ['1', '2'] },
        { id: '2', name: 'test-role-2', assignableRoleNames: ['2'] },
        { id: '3', name: 'test-role-3', assignableRoleNames: ['3', '1'] },
        { id: '4', name: 'test-role-4', assignableRoleNames: ['4', '1'] },
        { id: '5', name: 'test-role-5', assignableRoleNames: ['5'] },
        { id: '6', name: 'test-role-6', assignableRoleNames: ['6', '2', '5'] },
        { id: '7', name: 'test-role-7', assignableRoleNames: ['7'] },
        { id: '8', name: 'test-role-8', assignableRoleNames: ['9'] },
        { id: '9', name: 'test-role-9', assignableRoleNames: [] }
      ];
      const results = ['test-role-3', 'test-role-1', 'test-role-6', 'test-role-2', 'test-role-5', 'test-role-9'];

      const mockAxios = {get: async () => results} as any;
      
      
      const api = new IdamAPI(mockAxios, mockAxios);
      api.getAllV2Roles = jest.fn();

      when(api.getAllV2Roles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as V2Role[]));
      expect(api.getAssignableRoles(['test-role-3', 'test-role-6', 'test-role-8'])).resolves.toEqual(results);
      expect(api.getAllV2Roles). toHaveBeenCalledTimes(1);
    });

    test('Should return only itself as assignable role if no other assignable roles', () => {
      const getAllRolesMockResponse: Partial<V2Role>[] = [
        { id: '1', name: 'test-role-1', assignableRoleNames: ['1', '2'] },
        { id: '2', name: 'test-role-2', assignableRoleNames: ['2'] },
      ];
      const results = ['test-role-2'];

      const mockAxios = {get: async () => results} as any;
      
      
      const api = new IdamAPI(mockAxios, mockAxios);
      api.getAllV2Roles = jest.fn();

      when(api.getAllV2Roles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as V2Role[]));
      expect(api.getAssignableRoles(['test-role-2'])).resolves.toEqual(results);
      expect(api.getAllV2Roles). toHaveBeenCalledTimes(1);
    });

    test('Should return empty if no assignable roles or role undefined', () => {
      const getAllRolesMockResponse: Partial<V2Role>[] = [
        { id: '1', name: 'test-role-1', assignableRoleNames: ['1', '2'] },
        { id: '2', name: 'test-role-2', assignableRoleNames: [] },
        { id: '3', name: 'test-role-3' },
        undefined as unknown as V2Role
      ];

      const mockAxios = {get: async () => jest.fn()} as any;
      
      
      const api = new IdamAPI(mockAxios, mockAxios);
      api.getAllV2Roles = jest.fn();

      when(api.getAllV2Roles).mockReturnValue(Promise.resolve(getAllRolesMockResponse as V2Role[]));
      expect(api.getAssignableRoles(['test-role-2', 'test-role-3'])).resolves.toEqual([]);
      expect(api.getAllV2Roles). toHaveBeenCalledTimes(1);
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
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.editUserById(testToken, testUserId, fields)).resolves.toEqual(results.data);
    });

    test('Should not return updated user details when error', () => {
      const fields = {
        forename: 'test changed',
        surname: 'test changed',
      };
      const mockAxios = {patch: () => Promise.reject('')} as any;
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.editUserById(testToken, testUserId, fields)).rejects.toEqual('Error patching user details in IDAM API');
    });
  });

  describe('deleteUserById', () => {
    test('Should delete user using valid user ID', async () => {
      const mockAxios = {delete: jest.fn().mockReturnValue(Promise.resolve())} as any;
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      await expect(api.deleteUserById(testUserId)).resolves.not.toThrow();
      expect(mockAxios.delete).toHaveBeenCalledWith('/api/v2/users/12345');
    });

    test('Should not return user details when using invalid ID', async () => {
      const mockAxios = {delete: jest.fn().mockReturnValue(Promise.reject('Delete failed'))} as any;
      
      const api = new IdamAPI(mockAxios, mockAxios);

      await expect(api.deleteUserById('-1')).rejects.toThrow('Error deleting user by ID from IDAM API');
      expect(mockAxios.delete).toHaveBeenCalledWith('/api/v2/users/-1');
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
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.registerUser(testToken, input)).resolves.toEqual(testValue);
    });

    test('Should not register a user when error', () => {
      const mockAxios = {post: () => Promise.reject('')} as any;
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.registerUser(testToken, input)).rejects.toEqual('Error register new user in IDAM API');
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
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.getAllServices()).resolves.toEqual(results.data);
    });

    test('Should not get services when error', () => {
      const mockAxios = {get: () => Promise.reject('')} as any;
      const api = new IdamAPI(mockAxios, mockAxios);

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
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.grantRolesToUser(testToken, testUserId, roleDefinitions)).resolves.toEqual(testValue);
    });

    test('Should not grant roles to user when error', () => {
      const mockAxios = {post: () => Promise.reject('')} as any;
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.grantRolesToUser(testToken, testUserId, roleDefinitions)).rejects.toEqual('Error granting user roles in IDAM API');
    });
  });

  describe('removeRoleFromUser', () => {
    test('Should remove roles from user', () => {
      const testValue = 1;
      const result = {data: testValue};
      const mockAxios = {delete: async () => Promise.resolve(result)} as any;
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.removeRoleFromUser(testToken, testUserId, 'role1')).resolves.toEqual(testValue);
    });

    test('Should not remove roles from user when error', () => {
      const mockAxios = {delete: () => Promise.reject('')} as any;
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.removeRoleFromUser(testToken, testUserId, 'role1')).rejects.toEqual('Error deleting user role in IDAM API');
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
      const expectedAxiosCall = '/api/v1/users?size=20&page=0&query=(roles:IDAM_SUPER_USER)';

      const mockAxios: any = { get: jest.fn().mockResolvedValue(results) };
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.getUsersWithRoles(testToken, roles)).resolves.toEqual(results.data);
      expect(mockAxios.get).toHaveBeenCalledWith(expectedAxiosCall, {
        'headers': {
          Authorization: 'Bearer test-token'
        },
        'timeout': 20000});
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
      const expectedAxiosCall = '/api/v1/users?size=20&page=0&query=(roles:IDAM_SUPER_USER OR roles:IDAM_ADMIN_USER)';

      const mockAxios: any = { get: jest.fn().mockResolvedValue(results) };
      
      
      const api = new IdamAPI(mockAxios, mockAxios);

      expect(api.getUsersWithRoles(testToken, roles)).resolves.toEqual(results.data);
      expect(mockAxios.get).toHaveBeenCalledWith(expectedAxiosCall, {
        'headers': {
          Authorization: 'Bearer test-token'
        },
        'timeout': 20000});
    });

    test('Should return error if API issue', async () => {
      const roles = ['IDAM_SUPER_USER'];

      const mockAxios: any = {get: jest.fn().mockRejectedValue('')};
      
      const api = new IdamAPI(mockAxios, mockAxios);

      await expect(api.getUsersWithRoles(testToken, roles)).rejects.toThrow();
    });
  });
});
