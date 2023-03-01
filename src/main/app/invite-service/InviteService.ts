import { AuthorizedAxios } from '../authorized-axios/AuthorizedAxios';
import config from 'config';
import { Logger } from '../../interfaces/Logger';
import { TelemetryClient } from 'applicationinsights';

enum invitationTypes {
  INVITE = 'INVITE',
  SELF_REGISTER = 'SELF_REGISTER',
  REACTIVATE = 'REACTIVATE',
}

export class InviteService {
  private readonly INVITE_ENDPOINT: string = config.get('services.idam.endpoint.invite');
  private readonly CLIENT_ID: string = config.get('services.idam.clientID')

  constructor(
    private readonly idamApiAxios: AuthorizedAxios,
    private readonly logger: Logger,
    private readonly telemetryClient: TelemetryClient
  ) {}

  public inviteUser = (
    email: string,
    forename: string,
    surname: string,
    roles: string[] = [],
    invitedBy?: string,
    successRedirect?: string,
    clientId = this.CLIENT_ID
  ) => {
    return this.idamApiAxios
      .post(this.INVITE_ENDPOINT, {
        invitationType: invitationTypes.INVITE,
        email,
        forename,
        surname,
        clientId,
        activationRoleNames: roles,
        invitedBy,
        successRedirect
      })
      .catch(error => {
        const errorMessage = 'Error inviting user through IDAM API';
        this.telemetryClient.trackTrace({message: errorMessage});
        this.logger.error(`${error.stack || error}`);
        throw new Error(errorMessage);
      });
  };
}
