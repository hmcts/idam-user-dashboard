import autobind from 'autobind-decorator';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { convertToArray, hasProperty } from '../utils/utils';
import { MISSING_ROLE_ASSIGNMENT_ERROR } from '../utils/error';
import { constructAllRoleAssignments } from '../utils/roleUtils';
import { InviteService } from '../app/invite-service/InviteService';

@autobind
export class AddUserRolesController extends RootController {
  constructor(
    private readonly inviteService: InviteService
  ) {
    super();
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const fields = req.body;

    if (!hasProperty(req.body, 'roles')) {
      const allRoles = await req.scope.cradle.api.getAllRoles();
      const roleAssignment = constructAllRoleAssignments(allRoles, req.session.user.assignableRoles);

      const user = {
        email: fields._email,
        forename: fields._forename,
        surname: fields._surname
      };

      return super.post(req, res, 'add-user-roles', {
        content: { user: user, roles: roleAssignment },
        error: { roles: { message: MISSING_ROLE_ASSIGNMENT_ERROR } }
      });
    }

    const roles = fields.roles;

    await this.inviteService.inviteUser(
      fields._email,
      fields._forename,
      fields._surname,
      convertToArray(roles),
      req.session.user.id
    );

    return super.post(req, res, 'add-user-completion');
  }
}
