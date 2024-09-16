import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import autobind from 'autobind-decorator';
import { USER_DETAILS_URL } from '../utils/urls';
import { PageError } from '../interfaces/PageData';
import { isEmpty } from '../utils/utils';
import { MISSING_OPTION_ERROR, USER_REMOVE_SSO_ERROR } from '../utils/error';
import { User } from '../interfaces/User';


@autobind
export class UserRemoveSsoController extends RootController{

  @asyncError
  public post(req: AuthedRequest, res: Response) {
    return req.scope.cradle.api.getUserById(req.idam_user_dashboard_session.access_token, req.body._userId)
      .then(user => {
        switch(req.body.confirmSso) {
          case 'true':
            return this.removeSso(req, res, user);
          case 'false':
            return res.redirect(307, USER_DETAILS_URL.replace(':userUUID', req.body._userId));
        }

        if(req.body._action === 'confirm-remove-sso') {
          return super.post(req, res, 'remove-sso-user', {
            content: { user },
            error: this.validateFields(req.body)
          });
        }

        return super.post(req, res, 'remove-sso-user', { content: { user } });
      });
  }

  private removeSso(req: AuthedRequest, res: Response, user: User) {
    return req.scope.cradle.api.removeSsoById(req.idam_user_dashboard_session.access_token, req.body._userId)
      .then(() => {
        return super.post(req, res, 'remove-sso-user-successful', { content: { user } } );
      })
      .catch(() => {
        const error = { userRemoveSsoForm: { message: USER_REMOVE_SSO_ERROR } };
        return super.post(req, res, 'remove-sso-user', { content: { user }, error } );
      });
  }

  private validateFields(fields: any): PageError {
    const errors: any = {};
    if(isEmpty(fields.confirmRadio)) errors.confirmRadio = { message: MISSING_OPTION_ERROR };
    return errors;
  }
}
