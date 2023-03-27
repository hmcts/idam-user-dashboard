import { ServiceProviderService } from '../../../main/app/service-provider-service/ServiceProviderService';

export const mockServiceProviderService = () => {
  const mock: Partial<ServiceProviderService> = {
    getService: jest.fn()
  };

  return mock as ServiceProviderService;
};
