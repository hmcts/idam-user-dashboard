import {AuthedRequest} from '../interfaces/AuthedRequest';
import {Response} from 'express';
import {RootController} from './RootController';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import autobind from 'autobind-decorator';
import {USER_DETAILS_URL} from '../utils/urls';
import {PageError} from '../interfaces/PageData';
import {isEmpty} from '../utils/utils';
import {MISSING_OPTION_ERROR, USER_DELETE_FAILED_ERROR} from '../utils/error';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
import {canManageRoles, loadUserAssignableRoles, processMfaRoleV2} from '../utils/roleUtils';
import { constants as http } from 'http2';
import { HTTPError } from '../app/errors/HttpError';
import { V2User } from '../interfaces/V2User';

@autobind
export class UserDeleteController extends RootController {

  constructor(private readonly idamWrapper: IdamAPI, protected featureFlags?: FeatureFlags) {
    super(featureFlags);
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    await loadUserAssignableRoles(req, this.idamWrapper);
    return this.idamWrapper.getUserV2ById(req.body._userId)
      .then(user => {
        this.assertUserIsManageable(req, user);
        switch (req.body.confirmDelete) {
          case 'true':
            return this.deleteUser(req, res, user);
          case 'false':
            return res.redirect(307, USER_DETAILS_URL.replace(':userUUID', req.body._userId));
        }

        if (req.body._action === 'confirm-delete') {
          return super.post(req, res, 'delete-user', {
            content: {user},
            error: this.validateFields(req.body)
          });
        }

        return super.post(req, res, 'delete-user', {content: {user}});
      });
  }

  private deleteUser(req: AuthedRequest, res: Response, user: V2User) {
    return this.idamWrapper.deleteUserById(req.body._userId)
      .then(() => {
        return super.post(req, res, 'delete-user-successful', {content: {user}});
      })
      .catch(() => {
        const error = {userDeleteForm: {message: USER_DELETE_FAILED_ERROR}};
        return super.post(req, res, 'delete-user', {content: {user}, error});
      });
  }

  private validateFields(fields: any): PageError {
    const errors: any = {};
    if (isEmpty(fields.confirmRadio)) errors.confirmRadio = {message: MISSING_OPTION_ERROR};
    return errors;
  }

  private assertUserIsManageable(req: AuthedRequest, user: V2User) {
    const assignableRoles = req.idam_user_dashboard_session.user.assignableRoles || [];
    processMfaRoleV2(user);

    if (!canManageRoles(assignableRoles, user.roleNames)) {
      throw new HTTPError(
        http.HTTP_STATUS_FORBIDDEN,
        'Cannot delete user because they have roles you cannot manage'
      );
    }
  }
}
