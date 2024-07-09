import config from 'config';
import { when } from 'jest-when';
import { mockAxios } from '../../../utils/mockAxios';
import { mockLogger } from '../../../utils/mockLogger';
import { ServiceProviderService } from '../../../../../main/app/service-provider-service/ServiceProviderService';
import { constants as http } from 'http2';
import { HTTPError } from '../../../../../main/app/errors/HttpError';

jest.mock('config');

describe('ServiceProviderService', () => {
  const mockedAxios = mockAxios();
  const mockedLogger = mockLogger();
  const mockEndpoint = '/services';
  when(config.get).mockReturnValue(mockEndpoint);
  const serviceProviderService = new ServiceProviderService(mockedAxios, mockedLogger);

  describe('getService', () => {
    test('Should resolve if no error from axios', () => {
      const clientId = 'someClientId';
      const response = {
        data: 'someData'
      };

      (mockedAxios.get as jest.Mock).mockResolvedValue(response);

      expect(serviceProviderService.getService(clientId)).resolves.toBe(response.data);
    });

    test('Should throw if error from axios', () => {
      const clientId = 'someClientId';
      const statusCode = http.HTTP_STATUS_FORBIDDEN;
      (mockedAxios.get as jest.Mock).mockRejectedValue({
        response: {
          status: statusCode
        }
      });

      expect(serviceProviderService.getService(clientId)).rejects.toThrow(new HTTPError(statusCode, 'Error getting service info from IDAM API'));
    });
  });
});
