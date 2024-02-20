import { constants as http } from 'http2';
import { AuthorizedAxios } from '../authorized-axios/AuthorizedAxios';
import { InvitationTypes, Invite } from './Invite';
import config from 'config';
import { HTTPError } from '../errors/HttpError';
import { Logger } from '../../interfaces/Logger';

export class InviteService {
  private readonly INVITE_ENDPOINT: string = config.get('services.idam.endpoint.invite');
  private readonly appointmentMapString: string = config.get('services.idam.appointmentMap');
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
    const APPOINTMENT_MAP = JSON.parse(this.appointmentMapString);
    const matchedInvitationType: InvitationTypes =
      this.getEmailAppointmentMapEntryAsInvitationType(invite.email, APPOINTMENT_MAP);
    if (matchedInvitationType) {
      return this.sendInvite(matchedInvitationType, invite, language)
    }
    return this.sendInvite(InvitationTypes.INVITE, invite, language);
  };

  getEmailAppointmentMapEntryAsInvitationType(email: string, map: { [key: string]: string } ): InvitationTypes | undefined {
    let matchedValue: string;
    const emailDomainInMap = Object.keys(map).some(key => {
      const isMatch = email.toLowerCase().includes(key.toLowerCase());
      if (isMatch) {
        matchedValue = map[key];
      }
      return isMatch;
    });
    if (!emailDomainInMap) {
      return undefined;
    } else {
      const entries = Object.entries(InvitationTypes) as [keyof typeof InvitationTypes, string][];
      const found = entries.find(([key, val]) => val === matchedValue);
      return found ? InvitationTypes[found[0]] : undefined;
    }
  }

}
