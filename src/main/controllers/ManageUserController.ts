import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { convertISODateTimeToUTCFormat, isEmpty, isValidEmailFormat, possiblyEmail } from '../utils/utils';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_INPUT_ERROR,
  NO_USER_MATCHES_ERROR,
  PENDING_USER_EMAIL_ERROR,
  PENDING_USER_NO_INVITATIONS_ERROR,
  TOO_MANY_USERS_ERROR
} from '../utils/error';
import { USER_DETAILS_URL } from '../utils/urls';
import { User } from '../interfaces/User';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
import { InviteService } from '../app/invite-service/InviteService';
import { Invitation } from '../app/invite-service/Invite';
const obfuscate = require('obfuscate-mail');
import logger from '../modules/logging';
import { setTelemetryAttribute } from '../modules/opentelemetry/requestTraceAttributes';

@autobind
export class ManageUserController extends RootController {

  constructor(
    private readonly idamWrapper: IdamAPI,
    private readonly inviteService: InviteService,
    protected featureFlags?: FeatureFlags
  ) {
    super(featureFlags);
  }

  public get(req: AuthedRequest, res: Response) {
    return super.get(req, res, 'manage-user');
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const input: string = req.body.search !== undefined
      ? (req.body.search || '').trim()
      : req.body._userId || '';
    this.setTraceAttribute(req, 'search_term', possiblyEmail(input) ? obfuscate(input) : input);
    if (isEmpty(input)) {
      return this.postError(req, res, MISSING_INPUT_ERROR);
    }

    const users = await this.searchForUser(req, res, input);
    this.setTraceAttribute(req, 'match_count', users ? users.length : 0);

    if (users) {
      if (users.length === 1) {
        const user = users[0];
        this.setTraceAttribute(req, 'match_user_id', user.id);
        if (user.pending === true) {
          const email = (user.email || '').trim();
          if (!isValidEmailFormat(email)) {
            return this.postError(req, res, PENDING_USER_EMAIL_ERROR);
          }
          return this.postInvitationResults(req, res, { email }, PENDING_USER_NO_INVITATIONS_ERROR);
        }
        return res.redirect(307, USER_DETAILS_URL.replace(':userUUID', user.id));
      }
      logger.info('ManageUserController.post, found ' + users.length + ' result(s) for input ' + (possiblyEmail(input) ? obfuscate(input) : input));
      if (users.length === 0) {
        const search = possiblyEmail(input) ? { email: input } : { userId: input };
        return this.postInvitationResults(req, res, search, NO_USER_MATCHES_ERROR + input);
      }
      return this.postError(req, res, (users.length > 1 ? TOO_MANY_USERS_ERROR : NO_USER_MATCHES_ERROR) + input);
    }
  }

  private async searchForUser(req: AuthedRequest, res: Response, input: string): Promise<User[]> {
    if (possiblyEmail(input)) {
      if (!isValidEmailFormat(input)) {
        this.postError(req, res, INVALID_EMAIL_FORMAT_ERROR);
        return;
      }
      return await this.idamWrapper.searchUsersByEmail(req.idam_user_dashboard_session.access_token, input);
    }

    // only search for SSO ID if searching with the user ID does not return any result
    return await this.idamWrapper.getUserById(req.idam_user_dashboard_session.access_token, input)
      .then(user => {
        return [user];
      })
      .catch(() => {
        return this.idamWrapper.searchUsersBySsoId(req.idam_user_dashboard_session.access_token, input);
      });
  }

  private async postInvitationResults(
    req: AuthedRequest,
    res: Response,
    search: { email: string } | { userId: string },
    noInvitationsError: string
  ) {
    const invitations = 'email' in search
      ? await this.inviteService.searchInvitationByEmail(search.email)
      : await this.inviteService.searchInvitationByUserId(search.userId);
    this.setTraceAttribute(req, 'invitation_match_count', invitations.length);
    if (invitations.length === 0) {
      return this.postError(req, res, noInvitationsError);
    }
    const preparedInvitations = this.prepareInvitations(invitations);
    return super.post(req, res, 'invitation-results', {
      content: {
        ...search,
        invitationCount: preparedInvitations.length,
        invitations: preparedInvitations
      }
    });
  }

  private postError(req: AuthedRequest, res: Response, errorMessage: string) {
    return super.post(req, res, 'manage-user', {
      error: {
        search: {message: errorMessage}
      }
    });
  }

  private setTraceAttribute(req: AuthedRequest, attrName : string, attrValue : any) {
    setTelemetryAttribute(req, attrName, attrValue);
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
}
