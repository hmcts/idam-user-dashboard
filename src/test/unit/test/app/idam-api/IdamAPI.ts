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
