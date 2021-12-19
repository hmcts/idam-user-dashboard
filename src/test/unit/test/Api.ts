import {Api} from '../../../main/Api';

describe('Api', () => {
  const email = 'test@test.com';
  test('Should return results from getUsersByEmail request', async () => {
    const results = {
      data: [{
        forename: 'test',
        surname: 'test',
        email: email,
        active: true,
        roles: 'IDAM_SUPER_USER'
      }]
    };
    const mockAxios = {get: async () => results} as any;
    const api = new Api(mockAxios);
    await expect(api.getUsersByEmail(email)).resolves.toEqual(results.data);
  });

  test('Should not return results from getUsersByEmail request if error', async () => {
    const mockAxios = {get: async () => {throw new Error ('error')}} as any;
    const api = new Api(mockAxios);
    await expect(api.getUsersByEmail(email)).resolves.toEqual([]);
  });
});
