import autobind from 'autobind-decorator';
import { Response } from 'express';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { User } from '../interfaces/User';
import { AccountStatus, RecordType, V2User } from '../interfaces/V2User';
import {
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
  IDAM_MFA_DISABLED, loadUserAssignableRoles,
  processRoleBasedAttributes,
  CITIZEN_ROLE, CASEWORKER_ROLE
} from '../utils/roleUtils';
import { UserRoleAssignment } from '../interfaces/UserRoleAssignment';
import config from 'config';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
import { trace } from '@opentelemetry/api';
import logger from '../modules/logging';

@autobind
export class UserEditController extends RootController {

  constructor(private readonly idamWrapper: IdamAPI, protected featureFlags?: FeatureFlags) {
    super(featureFlags);
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    await loadUserAssignableRoles(req, this.idamWrapper);
    return this.idamWrapper.getUserById(req.idam_user_dashboard_session.access_token, req.body._userId)
      .then(user => {
        trace.getActiveSpan()?.setAttribute('edit_user_id', user.id);

        const assignableRoles: string[] = req.idam_user_dashboard_session.user.assignableRoles;

        const roleAssignments = constructUserRoleAssignments(assignableRoles, user.roles);
        processRoleBasedAttributes(user);

        if(req.body._action === 'save') {
          return this.saveUser(req, res, user, roleAssignments);
        }

        return super.post(req, res, 'edit-user', {content: this.editUserContent(req, user, roleAssignments)});
      });
  }

  private editUserContent(req: AuthedRequest, user: any, roleAssignments: any) {
    return {
      user,
      roles: roleAssignments,
      showMfa: this.canShowMfa(req.idam_user_dashboard_session.user.assignableRoles),
      ...(user.ssoProvider) && { mfaMessage: this.generateMFAMessage(user.ssoProvider) },
      manageCitizenAttribute: this.isCaseworkerCitizen(user.isCitizen, user.roles) || this.canManageCitizen(req.idam_user_dashboard_session.user.assignableRoles),
      showCitizenConflict: this.isCaseworkerCitizen(user.isCitizen, user.roles)
    };
  }

  private convertToV1View(v2User: V2User): User {
    const filteredRoles =
    v2User.roleNames?.filter(
      (r) => r !== CITIZEN_ROLE && r !== IDAM_MFA_DISABLED
    ) || [];
    return {
      id: v2User.id,
      forename: v2User.forename,
      surname: v2User.surname,
      email: v2User.email,
      active: v2User.accountStatus === AccountStatus.ACTIVE,
      locked: v2User.accountStatus === AccountStatus.LOCKED,
      pending: false, // always false
      stale: v2User.recordType === RecordType.ARCHIVED, // based on RecordType
      pwdAccountLockedTime: v2User.accessLockedDate,
      roles: filteredRoles,
      ssoProvider: v2User.ssoProvider || '',
      ssoId: v2User.ssoId || '',
      lastModified: v2User.lastModified || '',
      createDate: v2User.createDate,
      multiFactorAuthentication: !v2User.roleNames?.includes(IDAM_MFA_DISABLED),
      isCitizen: v2User.roleNames?.includes(CITIZEN_ROLE) || false
    };
  }

  private async saveUser(
    req: AuthedRequest,
    res: Response,
    user: User,
    roleAssignments: UserRoleAssignment[]
  ) {
    const { _action, _csrf, _userId, ...editedUser } = req.body;

    const {
      roles: originalRoles,
      multiFactorAuthentication: originalMfa,
      isCitizen: originalIsCitizen,
      ...originalFields
    } = user;

    const {
      roles: inEditedRoles,
      multiFactorAuthentication: editedMfa,
      isCitizen: editedIsCitizen,
      ...editedFields
    } = editedUser as Partial<User>;

    const editedRoles = Array.isArray(inEditedRoles)
      ? inEditedRoles
      : inEditedRoles
      ? [inEditedRoles]
      : [];

    const originalRolesWithAttributeRolesRemoved = originalRoles.filter(
      (r) => r !== IDAM_MFA_DISABLED && r !== CITIZEN_ROLE
    );
    const newRoleList = this.getUserRolesAfterUpdate(
      req,
      originalRolesWithAttributeRolesRemoved,
      editedRoles
    );
    const rolesAdded =
      newRoleList && newRoleList.length > 0
        ? findDifferentElements(newRoleList, originalRolesWithAttributeRolesRemoved)
        : [];
    const rolesRemoved =
      newRoleList && newRoleList.length > 0
        ? findDifferentElements(originalRolesWithAttributeRolesRemoved, newRoleList)
        : originalRolesWithAttributeRolesRemoved;

    const mfaAssignable = this.canShowMfa(
      req.idam_user_dashboard_session.user.assignableRoles
    );
    const { mfaAdded, mfaRemoved } = this.wasMfaAddedOrRemoved(
      user,
      mfaAssignable,
      originalMfa,
      editedMfa
    );

    const citizenAssignable =
      this.isCaseworkerCitizen(user.isCitizen, user.roles) ||
      this.canManageCitizen(req.idam_user_dashboard_session.user.assignableRoles);
    const { citizenAdded, citizenRemoved } = this.wasCitizenAddedOrRemoved(
      user,
      citizenAssignable,
      originalIsCitizen,
      editedIsCitizen
    );

    const rolesChanged =
      rolesAdded.length > 0 ||
      rolesRemoved.length > 0 ||
      mfaAdded ||
      mfaRemoved ||
      citizenAdded ||
      citizenRemoved;

    const changedFields = this.comparePartialUsers(originalFields, editedFields);

  if (isObjectEmpty(changedFields) && !rolesChanged) {
    return this.userWasNotChangedErrorMessage(req, res, user, roleAssignments);
  }

    Object.keys(changedFields).forEach(
      (field) => (changedFields[field] = changedFields[field].trim())
    );

    const error = this.validateFields(changedFields);
    if (!isObjectEmpty(error)) {
      logger.warn(
        'Validation errors detected:',
        Object.entries(error).map(([key, { message }]) => `${key}: ${message}`)
      );
      return super.post(req, res, 'edit-user', {
        content: this.editUserContent(req, { ...user, ...changedFields }, roleAssignments),
        error,
      });
    }

    try {

      // fetch authoritative V2 user first
      const v2User = await this.idamWrapper.getUserV2ById(user.id);

      let finalRoles;
      if (rolesChanged) {
        const roleNameSet = new Set<string>(newRoleList);

        if (mfaRemoved) {
          roleNameSet.add(IDAM_MFA_DISABLED);
        } else {
          roleNameSet.delete(IDAM_MFA_DISABLED);
        }

        if (citizenAdded) {
          roleNameSet.add(CITIZEN_ROLE);
        } else if (citizenRemoved) {
          roleNameSet.delete(CITIZEN_ROLE);
        }

        finalRoles = Array.from(roleNameSet).sort((a, b) => a.localeCompare(b));
      } else {
        finalRoles = v2User.roleNames;
      }

      // build V2User payload
      const updatedUser: V2User = {
        ...v2User,
        forename: changedFields.forename ?? user.forename,
        surname: changedFields.surname ?? user.surname,
        email: changedFields.email ?? user.email,
        roleNames: finalRoles
      };

      const savedUser = await this.idamWrapper.updateV2User(updatedUser);

      const v1View = this.convertToV1View(savedUser)

      roleAssignments = await this.reconstructRoleAssignments(
        req,
        _userId,
        v1View.roles
      );

      return super.post(req, res, 'edit-user', {
        content: this.editUserContent(req, v1View, roleAssignments),
        ...{ notification: 'User saved successfully' }
      });
    } catch (e) {
      logger.warn('Exception saving user', e)
      const error = {
        userEditForm: { message: USER_UPDATE_FAILED_ERROR + user.email },
      };
      return super.post(req, res, 'edit-user', {
        content: this.editUserContent(req, user, roleAssignments),
        error,
      });
    }
  }

  private userWasNotChangedErrorMessage(req: AuthedRequest, res: Response, user: User, roleAssignments: UserRoleAssignment[]) {
    const error = {userEditForm: {message: USER_UPDATE_NO_CHANGE_ERROR}};
    return super.post(req, res, 'edit-user', {
      content: this.editUserContent(req, user, roleAssignments),
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

  private wasCitizenAddedOrRemoved(user: User, citizenAssignable: any, originalIsCitizen: boolean, editedIsCitizen: boolean) {
    const citizenAdded = citizenAssignable && !originalIsCitizen && typeof editedIsCitizen !== 'undefined';
    const citizenRemoved = citizenAssignable && originalIsCitizen && typeof editedIsCitizen === 'undefined';
    return {citizenAdded, citizenRemoved};
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

    const arr1 = Array.isArray(nonAssignableRoles) ? nonAssignableRoles : [];
    const arr2 = Array.isArray(editedRoles) ? editedRoles : [];
    return Array.from(new Set([...arr1, ...arr2]));
    
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
    let ssoDisplayName: string = ssoProvider;
    if(config.has(`providers.${ssoProvider}.internalName`)) {
      ssoDisplayName = config.get(`providers.${ssoProvider}.externalName`);
    }
    return 'Managed by ' + ssoDisplayName;
  }

  private canShowMfa(assignableRoles: string[]) {
    return assignableRoles.includes(IDAM_MFA_DISABLED);
  }

  private canManageCitizen(assignableRoles: string[]) {
    return assignableRoles.includes(CITIZEN_ROLE);
  }

  private isCaseworkerCitizen(isCitizen: boolean, roles: string[]) {
    return isCitizen && roles.includes(CASEWORKER_ROLE);
  }
}
