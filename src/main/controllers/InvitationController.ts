import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { convertISODateTimeToUTCFormat, isValidEmailFormat } from '../utils/utils';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  NO_USER_MATCHES_ERROR
} from '../utils/error';
import { InviteService } from '../app/invite-service/InviteService';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
import { InvitationSearchStore } from '../app/invite-service/InvitationSearchStore';
import { MANAGER_USER_URL } from '../utils/urls';
import { Invitation } from '../app/invite-service/Invite';

@autobind
export class InvitationController extends RootController {

  constructor(
    private readonly inviteService: InviteService,
    private readonly invitationSearchStore: InvitationSearchStore,
    protected featureFlags?: FeatureFlags
  ) {
    super(featureFlags);
  }

  @asyncError
  public async searchByEmailGet(req: AuthedRequest, res: Response) {
    const invitationSearchId = req.params.invitationSearchId;

    const searchContext = await this.invitationSearchStore.get(
      invitationSearchId
    );
    
    if (!searchContext) {
      return res.redirect(MANAGER_USER_URL);
    }

    const email = searchContext.email.trim();
    if (!isValidEmailFormat(email)) {
      return this.postError(req, res, INVALID_EMAIL_FORMAT_ERROR);
    }

    const invitations = this.prepareInvitations(await this.inviteService.searchInvitationByEmail(email));
    if (invitations.length === 0) {
      return this.postError(req, res, NO_USER_MATCHES_ERROR + email);
    }

    return super.post(req, res, 'invitation-results', {
      content: {
        email,
        invitationCount: invitations.length,
        invitations
      }
    });
  }

  private prepareInvitations(invitations: Invitation[]): Invitation[] {
    return invitations
      .slice()
      .sort((a, b) => this.getTime(b.createDate) - this.getTime(a.createDate))
      .map(invitation => ({
        ...invitation,
        createDate: convertISODateTimeToUTCFormat(invitation.createDate),
        lastModified: invitation.lastModified ? convertISODateTimeToUTCFormat(invitation.lastModified) : undefined
      }));
  }

  private getTime(date: string): number {
    const time = new Date(date).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private postError(req: AuthedRequest, res: Response, errorMessage: string) {
    return super.post(req, res, 'manage-user', {
      error: {
        search: {message: errorMessage}
      }
    });
  }
}
