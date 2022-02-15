import { IdamApi } from '../../../../../main/app/idam-api/IdamApi';
import axios from 'axios';

describe('Api', () => {
  const testEmail = 'test@test.com';
  const mockAxios = {} as any;
  axios.create = jest.fn(() => mockAxios);

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

    mockAxios.get = async() => results;
    const mockLogger = {} as any;
    const mockTelemetryClient = {} as any;
    const api = new IdamApi(mockLogger, mockTelemetryClient);

    await expect(api.getUsersByEmail(testEmail)).resolves.toEqual(results.data);
  });

  test('Should not return results from getUsersByEmail request if error', async () => {
    mockAxios.get = async() => { throw new Error('error'); };
    const mockLogger = { error: jest.fn() } as any;
    const mockTelemetryClient = { trackTrace: jest.fn() } as any;
    const api = new IdamApi(mockLogger, mockTelemetryClient);


    await expect(api.getUsersByEmail(testEmail)).resolves.toEqual([]);
    expect(mockLogger.error).toBeCalledTimes(1);
    expect(mockTelemetryClient.trackTrace).toBeCalledTimes(1);
  });
});
