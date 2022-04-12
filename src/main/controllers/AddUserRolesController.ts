import autobind from 'autobind-decorator';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { convertToArray, hasProperty } from '../utils/utils';
import { MISSING_ROLE_ASSIGNMENT_ERROR } from '../utils/error';
import { constructAllRoleAssignments } from '../utils/roleUtils';

@autobind
export class AddUserRolesController extends RootController {
  @asyncError
  public async post(req: AuthedRequest, res: Response) {

    if (!hasProperty(req.body, 'roles')) {
      const allRoles = await req.scope.cradle.api.getAllRoles();
      const roleAssignment = constructAllRoleAssignments(allRoles, req.session.user.assignableRoles);

      return super.post(req, res, 'add-user-roles', {
        content: { roles: roleAssignment },
        error: { roles: { message: MISSING_ROLE_ASSIGNMENT_ERROR } }
      });
    }

    const fields = req.body;
    const roles = fields.roles;
    await req.scope.cradle.api.registerUser({
      email: fields._email,
      firstName: fields._forename,
      lastName: fields._surname,
      roles: convertToArray(roles)
    });
    return super.post(req, res, 'add-user-completion');
  }
}
