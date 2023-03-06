import { constants as http } from 'http2';
import { AuthorizedAxios } from '../authorized-axios/AuthorizedAxios';
import { InvitationTypes, Invite } from './Invite';
import config from 'config';
import { HTTPError } from '../errors/HttpError';
import { Logger } from '../../interfaces/Logger';

export class InviteService {
  private readonly INVITE_ENDPOINT: string = config.get('services.idam.endpoints.invite');
  private readonly DEFAULT_ROLE = 'citizen';

  constructor(
    private readonly idamApiAxios: AuthorizedAxios,
    private readonly logger: Logger
  ) {}

  private sendInvite = (
    invitationType: InvitationTypes,
    invite: Invite,
    language: string
  ) => {
    return this.idamApiAxios
      .post(
        this.INVITE_ENDPOINT,
        {
          activationRoleNames: [this.DEFAULT_ROLE],
          invitationType,
          ...invite,
        },
        {
          headers: {
            'Accept-Language': language,
          },
        }
      )
      .catch(err => {
        this.logger.error('Failed to send invite');
        throw new HTTPError(http.HTTP_STATUS_INTERNAL_SERVER_ERROR, err);
      });
  };

  public inviteUser = (invite: Invite, language = 'en') => {
    return this.sendInvite(InvitationTypes.SELF_REGISTER, invite, language);
  };
}
