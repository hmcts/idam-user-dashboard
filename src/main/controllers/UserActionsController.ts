import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import { User } from '../interfaces/User';
import {
  getObjectVariation,
  hasProperty,
  isEmpty,
  isObjectEmpty,
  isValidEmailFormat
} from '../utils/utils';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  USER_EMPTY_FORENAME_ERROR,
  USER_EMPTY_SURNAME_ERROR,
  USER_UPDATE_FAILED_ERROR,
  USER_UPDATE_NO_CHANGE_ERROR
} from '../utils/error';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { PageError } from '../interfaces/PageData';

@autobind
export class UserActionsController extends RootController{

  @asyncError
  public post(req: AuthedRequest, res: Response) {
    return req.scope.cradle.api.getUserById(req.body._userId)
      .then((user) => {
        switch (req.body._action) {
          case 'save':
            return this.saveUser(req, res, user);
          case 'edit':
            return this.editUser(req, res, user);
        }});
  }

  private async saveUser(req: AuthedRequest, res: Response, user: User) {
    const {_action, _csrf, _userId, ...editedUser} = req.body;

    const {roles: originalRoles, ...originalFields} = user;
    const {roles: editedRoles, ...editedFields} = editedUser as Partial<User>;

    // No changes
    const changedFields = this.comparePartialUsers(originalFields, editedFields);
    if(isObjectEmpty(changedFields)) {
      const error = { general: { message: USER_UPDATE_NO_CHANGE_ERROR }};
      return super.post(req, res, 'edit-user', { content: { user }, error: error});
    }

    // Validation errors
    const error = this.validateFields(changedFields);
    if(!isObjectEmpty(error)) {
      return super.post(req, res, 'edit-user', { content: { user: {...user, ...changedFields } }, error});
    }

    try {
      let updatedUser = { ...originalFields, roles: originalRoles };
      if(!isObjectEmpty(changedFields)) {
        updatedUser = {
          ...updatedUser,
          ...await req.scope.cradle.api.editUserById(user.id, changedFields)
        };
      }

      super.post(req, res, 'edit-user', { content: { user: updatedUser, notification: 'User saved successfully'}});
    } catch (e) {
      const error = { userEditForm: { message: USER_UPDATE_FAILED_ERROR + user.email } };
      super.post(req, res, 'edit-user', {content: { user }, error });
    }
  }

  private async editUser(req: AuthedRequest, res: Response, user: User) {
    super.post(req, res, 'edit-user', { content: { user } });
  }

  private comparePartialUsers(userA: Partial<User>, userB: Partial<User>) {
    const variation: Partial<User> = getObjectVariation(userA, userB);
    return variation;
  }

  private validateFields(fields: Partial<User>): PageError {
    const { forename, surname, email } = fields;
    const errors: any = {};

    if(hasProperty(fields, 'forename') && isEmpty(forename)) errors.forename = { message: USER_EMPTY_FORENAME_ERROR };
    if(hasProperty(fields, 'surname') &&  isEmpty(surname)) errors.surname = { message: USER_EMPTY_SURNAME_ERROR };
    if(hasProperty(fields, 'email') && isValidEmailFormat(email)) errors.email = {message: INVALID_EMAIL_FORMAT_ERROR };

    return errors;
  }
}
