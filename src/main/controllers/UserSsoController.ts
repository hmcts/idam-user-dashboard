import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import autobind from 'autobind-decorator';
import { USER_DETAILS_URL } from '../utils/urls';
import { PageError } from '../interfaces/PageData';
import { isEmpty } from '../utils/utils';
import { MISSING_OPTION_ERROR, USER_DISABLE_SSO_ERROR } from '../utils/error';
import { User } from '../interfaces/User';


@autobind
export class UserSsoController extends RootController{

  @asyncError
  public post(req: AuthedRequest, res: Response) {
    return req.scope.cradle.api.getUserById(req.body._userId)
      .then(user => {
        switch(req.body.confirmSso) {
          case 'true':
            return this.removesso(req, res, user);
          case 'false':
            return res.redirect(307, USER_DETAILS_URL);
        }

        if(req.body._action === 'confirm-remove-sso') {
          return super.post(req, res, 'sso-user', {
            content: { user },
            error: this.validateFields(req.body)
          });
        }

        return super.post(req, res, 'sso-user', { content: { user } });
      });
  }

  private removesso(req: AuthedRequest, res: Response, user: User) {
    return req.scope.cradle.api.editUserById(req.body._userId, {ssoId:null, ssoProvider:null})
      .then(() => {
        return super.post(req, res, 'sso-user-successful', { content: { user } } );
      })
      .catch(() => {
        const error = { userRemoveSsoForm: { message: USER_DISABLE_SSO_ERROR } };
        return super.post(req, res, 'sso-user', { content: { user }, error } );
      });
  }

  private validateFields(fields: any): PageError {
    const errors: any = {};
    if(isEmpty(fields.confirmRadio)) errors.confirmRadio = { message: MISSING_OPTION_ERROR };
    return errors;
  }
}
