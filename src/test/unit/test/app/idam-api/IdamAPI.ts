import { IdamAPI } from '../../../../../main/app/idam-api/IdamAPI';
import {SearchType} from '../../../../../main/utils/SearchType';

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
      const api = new IdamAPI(mockAxios, mockLogger, mockTelemetryClient);

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
      const api = new IdamAPI(mockAxios, mockLogger, mockTelemetryClient);

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
      const api = new IdamAPI(mockAxios, mockLogger, mockTelemetryClient);

      expect(api.getUserById('')).rejects.toEqual('Error retrieving user by ID from IDAM API');
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
      const api = new IdamAPI(mockAxios, mockLogger, mockTelemetryClient);

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
      const api = new IdamAPI(mockAxios, mockLogger, mockTelemetryClient);

      expect(api.editUserById(testUserId, fields)).rejects.toEqual('Error patching user details in IDAM API');
    });
  });

  test('Should not return results from getUserDetails request if error', async () => {
    const mockAxios = {
      get: async () => { throw new Error ('error'); }
    } as any;
    const mockLogger = {
      error: async ( message: string ) => console.log(message)
    } as any;
    const mockTelemetryClient = {
      trackTrace: async ( message: string ) => console.log(message)
    } as any;
    const api = new IdamAPI(mockAxios, mockLogger, mockTelemetryClient);

    await expect(api.getUserDetails(SearchType['Email'], testEmail)).resolves.toEqual([]);
  });
});
