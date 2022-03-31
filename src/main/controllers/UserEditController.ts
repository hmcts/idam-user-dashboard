import autobind from 'autobind-decorator';
import { Response } from 'express';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { User } from '../interfaces/User';
import {
  convertToArray,
  findDifferentElements,
  getObjectVariation,
  hasProperty,
  isEmpty,
  isObjectEmpty,
  isValidEmailFormat
} from '../utils/utils';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  USER_EMPTY_EMAIL_ERROR,
  USER_EMPTY_FORENAME_ERROR,
  USER_EMPTY_SURNAME_ERROR,
  USER_UPDATE_FAILED_ERROR,
  USER_UPDATE_NO_CHANGE_ERROR
} from '../utils/error';
import { PageError } from '../interfaces/PageData';
import { constructUserRoleAssignments, determineUserNonAssignableRoles } from '../utils/roleUtils';
import { RoleDefinition } from '../interfaces/RoleDefinition';
import { UserRoleAssignment } from '../interfaces/UserRoleAssignment';


@autobind
export class UserEditController extends RootController {

  @asyncError
  public post(req: AuthedRequest, res: Response) {
    return req.scope.cradle.api.getUserById(req.body._userId)
      .then(user => {
        const roleAssignments = constructUserRoleAssignments(req.session.user.assignableRoles, user.roles);

        if(req.body._action === 'save') {
          return this.saveUser(req, res, user, roleAssignments);
        }

        return super.post(req, res, 'edit-user', { content: { user, roles: roleAssignments } });
      });
  }

  private async saveUser(req: AuthedRequest, res: Response, user: User, roleAssignments: UserRoleAssignment[]) {
    const {_action, _csrf, _userId, ...editedUser} = req.body;

    const {roles: originalRoles, ...originalFields} = user;
    const {roles: editedRoles, ...editedFields} = editedUser as Partial<User>;

    const newRoleList = this.getUserRolesAfterUpdate(req, originalRoles, editedRoles);
    const rolesAdded = findDifferentElements(newRoleList, originalRoles);
    const rolesRemoved = findDifferentElements(originalRoles, newRoleList);
    const rolesChanged = rolesAdded.length > 0 || rolesRemoved.length > 0;

    const changedFields = this.comparePartialUsers(originalFields, editedFields);

    // No changes
    if (isObjectEmpty(changedFields) && !rolesChanged) {
      const error = { userEditForm: { message: USER_UPDATE_NO_CHANGE_ERROR }};
      return super.post(req, res, 'edit-user', { content: { user, roles: roleAssignments },
        error: error });
    }

    Object.keys(changedFields).forEach(field => changedFields[field] = changedFields[field].trim());

    // Validation errors
    const error = this.validateFields(changedFields);
    if (!isObjectEmpty(error)) {
      return super.post(req, res, 'edit-user', { content: {
        user: {...user, ...changedFields},
        roles: roleAssignments
      },
      error });
    }

    try {
      let updatedUser = { ...originalFields, roles: originalRoles };
      if (!isObjectEmpty(changedFields)) {
        updatedUser = {
          ...updatedUser,
          ...await req.scope.cradle.api.editUserById(user.id, changedFields)
        };
      }

      if (rolesChanged) {
        updatedUser = { ...updatedUser, roles: newRoleList };
        await this.updateUserRoles(req, user, rolesAdded, rolesRemoved);
        roleAssignments = await this.reconstructRoleAssignments(req, _userId, newRoleList);
      }
      return super.post(req, res, 'edit-user', { content: { user: updatedUser, roles: roleAssignments, notification: 'User saved successfully'}});
    } catch (e) {
      const error = { userEditForm: { message: USER_UPDATE_FAILED_ERROR + user.email } };
      return super.post(req, res, 'edit-user', { content: { user, roles: roleAssignments },
        error });
    }
  }

  private comparePartialUsers(userA: Partial<User>, userB: Partial<User>) {
    const variation = getObjectVariation(userA, userB).changed;
    const changedFields: any = {};
    variation.forEach(key => { changedFields[key] = (userB as any)[key]; } );

    return changedFields;
  }

  private validateFields(fields: Partial<User>): PageError {
    const { forename, surname, email } = fields;
    const errors: PageError = {};

    if(hasProperty(fields, 'forename') && isEmpty(forename)) errors.forename = { message: USER_EMPTY_FORENAME_ERROR };
    if(hasProperty(fields, 'surname') && isEmpty(surname)) errors.surname = { message: USER_EMPTY_SURNAME_ERROR };
    if(hasProperty(fields, 'email') && isEmpty(email)) errors.email = {message: USER_EMPTY_EMAIL_ERROR };
    if(hasProperty(fields, 'email') && !isValidEmailFormat(email)) errors.email = {message: INVALID_EMAIL_FORMAT_ERROR };

    return errors;
  }

  private getUserRolesAfterUpdate(req: AuthedRequest, originalRoles: string[], editedRoles: string[]): string[] {
    const nonAssignableRoles = determineUserNonAssignableRoles(req.session.user.assignableRoles, originalRoles);
    const rolesToAssign = editedRoles ? convertToArray(editedRoles) : [];

    const newRoleList = [];
    newRoleList.push(...rolesToAssign, ...nonAssignableRoles);
    return newRoleList;
  }

  private convertRolesToDefinitions(roles: string[]): RoleDefinition[] {
    const roleDefinitions: RoleDefinition[] = [];
    roles.forEach(r => roleDefinitions.push({name: r}));
    return roleDefinitions;
  }

  private async updateUserRoles(req: AuthedRequest, user: User, rolesAdded: string[], rolesRemoved: string[]) {
    if (rolesAdded.length > 0) {
      await req.scope.cradle.api.grantRolesToUser(user.id, this.convertRolesToDefinitions(rolesAdded));
    }

    for (const r of rolesRemoved) {
      await req.scope.cradle.api.removeRoleFromUser(user.id, r);
    }
  }

  private async reconstructRoleAssignments(req: AuthedRequest, userId: string, newRoles: string[]): Promise<UserRoleAssignment[]> {
    // if the users are editing their owned roles, we need to get the users' new assignable roles again as these might have changed
    // after their roles are updated
    if (req.session.user.id === userId) {
      const newAssignableRoles = await req.scope.cradle.api.getAssignableRoles(newRoles);
      return constructUserRoleAssignments(newAssignableRoles, newRoles);
    }
    return constructUserRoleAssignments(req.session.user.assignableRoles, newRoles);
  }
}
