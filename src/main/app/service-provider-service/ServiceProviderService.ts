import config from 'config';
import { AuthorizedAxios } from '../authorized-axios/AuthorizedAxios';
import { ServiceProvider } from './ServiceProvider';
import { HTTPError } from '../errors/HttpError';
import Logger from '@hmcts/nodejs-logging';

export class ServiceProviderService {
  private readonly SERVICES_ENDPOINT: string = config.get('services.idam.endpoint.services');

  constructor(
    private readonly idamApiAxios: AuthorizedAxios,
    private readonly logger: Logger,
  ) {}

  public getService = (clientId: string): Promise<ServiceProvider> => {
    return this.idamApiAxios.get(this.SERVICES_ENDPOINT + '/' + clientId)
      .then(response => response.data)
      .catch(error => {
        const errorMessage = 'Error getting service info from IDAM API';
        this.logger.error(`${error.stack || error}`);
        throw new HTTPError(error.response.status, errorMessage);
      });
  };
}
