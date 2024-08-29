import autobind from 'autobind-decorator';
import {RootController} from './RootController';
import {AuthedRequest} from '../interfaces/AuthedRequest';
import {Response} from 'express';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import {convertToArray, hasProperty} from '../utils/utils';
import {MISSING_ROLE_ASSIGNMENT_ERROR} from '../utils/error';
import {constructAllRoleAssignments} from '../utils/roleUtils';
import {InviteService} from '../app/invite-service/InviteService';
import {ServiceProviderService} from '../app/service-provider-service/ServiceProviderService';
import config from 'config';
import {UserType} from '../utils/UserType';
import {InvitationTypes} from '../app/invite-service/Invite';

@autobind
export class AddUserRolesController extends RootController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly serviceProviderService: ServiceProviderService
  ) {
    super();
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const fields = req.body;

    if (!hasProperty(req.body, 'roles')) {
      const allRoles = await req.scope.cradle.api.getAllV2Roles();
      const roleAssignment = constructAllRoleAssignments(allRoles, req.idam_user_dashboard_session.user.assignableRoles);

      const user = {
        email: fields._email,
        forename: fields._forename,
        surname: fields._surname,
        userType: fields._usertype
      };

      return super.post(req, res, 'add-user-roles', {
        content: { user: user, roles: roleAssignment },
        error: { roles: { message: MISSING_ROLE_ASSIGNMENT_ERROR } }
      });
    }

    const roles = fields.roles;
    const serviceInfo = await this.serviceProviderService.getService(config.get('services.idam.clientID'));

    if(fields._usertype === UserType.Support) {
      await this.inviteService.inviteUser({
        email: fields._email,
        forename: fields._forename,
        surname: fields._surname,
        activationRoleNames: convertToArray(roles),
        invitedBy: req.idam_user_dashboard_session.user.id,
        clientId: serviceInfo.clientId,
        successRedirect: serviceInfo.hmctsAccess.postActivationRedirectUrl
      });
    } else {
      await this.inviteService.inviteUser({
        email: fields._email,
        forename: fields._forename,
        surname: fields._surname,
        activationRoleNames: convertToArray(roles),
        invitedBy: req.idam_user_dashboard_session.user.id,
        clientId: serviceInfo.clientId
      });
    }

    const isAppointInvitationType =
      this.inviteService.tryMatchAppointmentTypeByEmail(fields._email) === InvitationTypes.APPOINT;
    return super.post(req, res, 'add-user-completion',
      { content: { isAppointInvitationType: isAppointInvitationType }});
  }
}
