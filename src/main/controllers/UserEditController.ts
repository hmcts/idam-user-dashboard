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
import {
  constructUserRoleAssignments,
  determineUserNonAssignableRoles,
  IDAM_MFA_DISABLED,
  processMfaRole
} from '../utils/roleUtils';
import { RoleDefinition } from '../interfaces/RoleDefinition';
import { UserRoleAssignment } from '../interfaces/UserRoleAssignment';
import config from 'config';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
@autobind
export class UserEditController extends RootController {

  constructor(private readonly idamWrapper: IdamAPI, protected featureFlags?: FeatureFlags) {
    super(featureFlags);
  }

  @asyncError
  public post(req: AuthedRequest, res: Response) {
    return this.idamWrapper.getUserById(req.idam_user_dashboard_session.access_token, req.body._userId)
      .then(user => {
        const roleAssignments = constructUserRoleAssignments(req.idam_user_dashboard_session.user.assignableRoles, user.roles);
        processMfaRole(user);

        if(req.body._action === 'save') {
          return this.saveUser(req, res, user, roleAssignments);
        }

        return super.post(req, res, 'edit-user', {
          content: {
            user,
            roles: roleAssignments,
            showMfa: this.canShowMfa(req.idam_user_dashboard_session.user.assignableRoles),
            ...(user.ssoProvider) && { mfaMessage: this.generateMFAMessage(user.ssoProvider) }
          }
        });
      });
  }

  private async saveUser(req: AuthedRequest, res: Response, user: User, roleAssignments: UserRoleAssignment[]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {_action, _csrf, _userId, ...editedUser} = req.body;

    const {roles: originalRoles, multiFactorAuthentication: originalMfa, ...originalFields} = user;
    const {roles: editedRoles, multiFactorAuthentication: editedMfa, ...editedFields} = editedUser as Partial<User>;

    const originalRolesWithMfaRemoved = originalRoles.filter(r => r !== IDAM_MFA_DISABLED);
    const newRoleList = this.getUserRolesAfterUpdate(req, originalRolesWithMfaRemoved, editedRoles);
    const rolesAdded = findDifferentElements(newRoleList, originalRolesWithMfaRemoved);
    const rolesRemoved = findDifferentElements(originalRolesWithMfaRemoved, newRoleList);

    const mfaAssignable = this.canShowMfa(req.idam_user_dashboard_session.user.assignableRoles);
    const {mfaAdded, mfaRemoved} = this.wasMfaAddedOrRemoved(user, mfaAssignable, originalMfa, editedMfa);

    const rolesChanged = rolesAdded.length > 0 || rolesRemoved.length > 0 || mfaAdded || mfaRemoved;
    const changedFields = this.comparePartialUsers(originalFields, editedFields);

    // No changes
    if (isObjectEmpty(changedFields) && !rolesChanged) {
      return this.userWasNotChangedErrorMessage(req, res, user, roleAssignments, mfaAssignable);
    }

    Object.keys(changedFields).forEach(field => changedFields[field] = changedFields[field].trim());

    // Validation errors
    const error = this.validateFields(changedFields);
    if (!isObjectEmpty(error)) {
      return super.post(req, res, 'edit-user', { content: {
        user: {...user, ...changedFields},
        roles: roleAssignments,
        showMfa: mfaAssignable,
        ...(user.ssoProvider) && { mfaMessage: this.generateMFAMessage(user.ssoProvider) }
      },
      error });
    }

    try {
      let updatedUser = { ...originalFields, roles: originalRolesWithMfaRemoved, multiFactorAuthentication: originalMfa };
      if (!isObjectEmpty(changedFields)) {
        updatedUser = {
          ...updatedUser,
          ...await this.idamWrapper.editUserById(req.idam_user_dashboard_session.access_token, user.id, changedFields)
        };
      }

      if (rolesChanged) {
        const updatedMfa = (user.multiFactorAuthentication && !mfaRemoved) || (!user.multiFactorAuthentication && mfaAdded);
        updatedUser = { ...updatedUser, roles: newRoleList, multiFactorAuthentication: updatedMfa };
        await this.updateUserRoles(req, user, rolesAdded, rolesRemoved, mfaAdded, mfaRemoved);
        roleAssignments = await this.reconstructRoleAssignments(req, _userId, newRoleList);
      }

      return super.post(req, res, 'edit-user', {
        content: {
          user: updatedUser,
          roles: roleAssignments,
          showMfa: mfaAssignable,
          ...(user.ssoProvider) && { mfaMessage: this.generateMFAMessage(user.ssoProvider) },
          notification: 'User saved successfully'
        }
      });
    } catch (e) {
      const error = { userEditForm: { message: USER_UPDATE_FAILED_ERROR + user.email } };
      return super.post(req, res, 'edit-user', {
        content: {
          user,
          roles: roleAssignments,
          showMfa: mfaAssignable,
          ...(user.ssoProvider) && { mfaMessage: this.generateMFAMessage(user.ssoProvider) }
        },
        error
      });
    }
  }

  private userWasNotChangedErrorMessage(req: AuthedRequest, res: Response, user: User, roleAssignments: UserRoleAssignment[], mfaAssignable: any) {
    const error = {userEditForm: {message: USER_UPDATE_NO_CHANGE_ERROR}};
    return super.post(req, res, 'edit-user', {
      content: {
        user,
        roles: roleAssignments,
        showMfa: mfaAssignable,
        ...(user.ssoProvider) && {mfaMessage: this.generateMFAMessage(user.ssoProvider)}
      },
      error
    });
  }

  private wasMfaAddedOrRemoved(user: User, mfaAssignable: any, originalMfa: boolean, editedMfa: boolean) {
    let mfaAdded, mfaRemoved = false;

    if (!user.ssoProvider) {
      mfaAdded = mfaAssignable && !originalMfa && typeof editedMfa !== 'undefined';
      mfaRemoved = mfaAssignable && originalMfa && typeof editedMfa === 'undefined';
    }
    return {mfaAdded, mfaRemoved};
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
    const nonAssignableRoles = determineUserNonAssignableRoles(req.idam_user_dashboard_session.user.assignableRoles, originalRoles);
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

  private async updateUserRoles(req: AuthedRequest, user: User, rolesAdded: string[], rolesRemoved: string[], mfaAdded: boolean, mfaRemoved: boolean) {
    if (rolesAdded.length > 0) {
      await this.idamWrapper.grantRolesToUser(req.idam_user_dashboard_session.access_token,user.id, this.convertRolesToDefinitions(rolesAdded));
    }

    for (const r of rolesRemoved) {
      await this.idamWrapper.removeRoleFromUser(req.idam_user_dashboard_session.access_token, user.id, r);
    }

    if (!user.multiFactorAuthentication && mfaAdded) {
      await this.idamWrapper.removeRoleFromUser(req.idam_user_dashboard_session.access_token, user.id, IDAM_MFA_DISABLED);
    }

    if (user.multiFactorAuthentication && mfaRemoved) {
      await this.idamWrapper.grantRolesToUser(req.idam_user_dashboard_session.access_token, user.id, this.convertRolesToDefinitions(convertToArray(IDAM_MFA_DISABLED)));
    }
  }

  private async reconstructRoleAssignments(req: AuthedRequest, userId: string, newRoles: string[]): Promise<UserRoleAssignment[]> {
    // if the users are editing their owned roles, we need to get the users' new assignable roles again as these might have changed
    // after their roles are updated
    if (req.idam_user_dashboard_session.user.id === userId) {
      const newAssignableRoles = await this.idamWrapper.getAssignableRoles(newRoles);
      return constructUserRoleAssignments(newAssignableRoles, newRoles);
    }
    return constructUserRoleAssignments(req.idam_user_dashboard_session.user.assignableRoles, newRoles);
  }

  private generateMFAMessage(ssoProvider: string): string {
    if(config.has(`providers.${ssoProvider}.internalName`)) {
      return 'Managed by ' + config.get(`providers.${ssoProvider}.externalName`);
    } else {
      return 'Managed by ' + ssoProvider;
    }
  }

  private canShowMfa(assignableRoles: string[]) {
    return assignableRoles.includes(IDAM_MFA_DISABLED);
  }
}
