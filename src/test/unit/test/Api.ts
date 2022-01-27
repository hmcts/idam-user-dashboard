import {Api} from '../../../main/Api';

describe('Api', () => {
  const testEmail = 'test@test.com';

  test('Should return results from getUsersByEmail request', async () => {
    const results = {
      data: [{
        forename: 'test',
        surname: 'test',
        email: testEmail,
        active: true,
        roles: ['IDAM_SUPER_USER']
      }]
    };
    const mockAxios = {get: async () => results} as any;
    const mockLogger = {} as any;
    const api = new Api(mockAxios, mockLogger);

    await expect(api.getUsersByEmail(testEmail)).resolves.toEqual(results.data);
  });

  test('Should not return results from getUsersByEmail request if error', async () => {
    const mockAxios = {
      get: async () => { throw new Error ('error'); }
    } as any;
    const mockLogger = {
      error: async ( message: string ) => console.log(message)
    } as any;
    const api = new Api(mockAxios, mockLogger);

    await expect(api.getUsersByEmail(testEmail)).resolves.toEqual([]);
  });
});
