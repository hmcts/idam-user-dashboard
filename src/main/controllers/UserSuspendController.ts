import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import autobind from 'autobind-decorator';
import { USER_DETAILS_URL } from '../utils/urls';
import { PageError } from '../interfaces/PageData';
import { isEmpty } from '../utils/utils';
import { MISSING_OPTION_ERROR, USER_UPDATE_FAILED_ERROR } from '../utils/error';
import { User } from '../interfaces/User';


@autobind
export class UserSuspendController extends RootController{

  @asyncError
  public post(req: AuthedRequest, res: Response) {
    return req.scope.cradle.api.getUserById(req.body._userId)
      .then(user => {
        switch(req.body.confirmSuspendRadio) {
          case 'true':
            return this.suspendUser(req, res, user);
          case 'false':
            return res.redirect(307, USER_DETAILS_URL);
        }

        switch(req.body.confirmUnSuspendRadio) {
          case 'true':
            return this.unSuspendUser(req, res, user);
          case 'false':
            return res.redirect(307, USER_DETAILS_URL);
        }

        switch(req.body._action) {
          case 'suspend':
            return super.post(req, res, 'suspend-user', { content: { user } });
          case 'confirm-suspend':
            return super.post(req, res, 'suspend-user', {
              content: { user },
              error: this.validateFields(req.body)
            });
          case 'un-suspend':
            return super.post(req, res, 'un-suspend-user', { content: { user } });
          case 'confirm-un-suspend':
            return super.post(req, res, 'un-suspend-user', {
              content: { user },
              error: this.validateFields(req.body)
            });
        }
      });
  }

  private suspendUser(req: AuthedRequest, res: Response, user: User) {
    return req.scope.cradle.api.editUserById(user.id, { active: false })
      .then(() => {
        return super.post(req, res, 'suspend-user-successful', { content: { user } } );
      })
      .catch(() => {
        const error = { userSuspendForm: { message: USER_UPDATE_FAILED_ERROR } };
        return super.post(req, res, 'suspend-user', { content: { user }, error } );
      });
  }

  private unSuspendUser(req: AuthedRequest, res: Response, user: User) {
    return req.scope.cradle.api.editUserById(user.id, { active: true })
      .then(() => {
        return super.post(req, res, 'un-suspend-user-successful', { content: { user } } );
      })
      .catch(() => {
        const error = { userSuspendForm: { message: USER_UPDATE_FAILED_ERROR } };
        return super.post(req, res, 'un-suspend-user', { content: { user }, error } );
      });
  }

  private validateFields(fields: any): PageError {
    const errors: PageError = {};
    if(fields._action === 'confirm-suspend' && isEmpty(fields.confirmSuspendRadio)) errors.confirmSuspendRadio = { message: MISSING_OPTION_ERROR };
    if(fields._action  === 'confirm-un-suspend' && isEmpty(fields.confirmUnSuspendRadio)) errors.confirmUnSuspendRadio = { message: MISSING_OPTION_ERROR };
    return errors;
  }
}
