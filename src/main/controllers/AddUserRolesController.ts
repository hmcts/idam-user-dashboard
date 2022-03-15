import autobind from 'autobind-decorator';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { hasProperty } from '../utils/utils';
import { MISSING_ROLE_ASSIGNMENT_ERROR } from '../utils/error';
import { constructRoleAssignment } from '../utils/roleUtils';

@autobind
export class AddUserRolesController extends RootController {
  @asyncError
  public async post(req: AuthedRequest, res: Response) {

    if (!hasProperty(req.body, 'roles')) {
      const allRoles = await req.scope.cradle.api.getAllRoles();
      const roleAssignment = constructRoleAssignment(allRoles, req.session.user.assignableRoles);

      return super.post(req, res, 'add-user-roles', {
        content: { roles: roleAssignment },
        error: { roles: { message: MISSING_ROLE_ASSIGNMENT_ERROR } }
      });
    }

    const fields = req.body;
    await req.scope.cradle.api.registerUser({
      email: fields._email,
      firstName: fields._forename,
      lastName: fields._surname,
      roles: fields.roles as string[]
    });
    return super.post(req, res, 'add-user-completion');
  }
}
