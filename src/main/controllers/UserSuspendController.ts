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
import { IdamAPI } from '../app/idam-api/IdamAPI';

@autobind
export class UserSuspendController extends RootController{

  constructor(private readonly idamWrapper: IdamAPI) {
    super();
  }

  @asyncError
  public post(req: AuthedRequest, res: Response) {
    return this.idamWrapper.getUserById(req.idam_user_dashboard_session.access_token, req.body._userId)
      .then(user => {
        switch(req.body.confirmSuspendRadio) {
          case 'true':
            return this.suspendUser(req, res, user);
          case 'false':
            return res.redirect(307, USER_DETAILS_URL.replace(':userUUID', req.body._userId));
        }

        switch(req.body.confirmUnSuspendRadio) {
          case 'true':
            return this.unSuspendUser(req, res, user);
          case 'false':
            return res.redirect(307, USER_DETAILS_URL.replace(':userUUID', req.body._userId));
        }

        switch(req.body._action) {
          case 'suspend':
            return super.post(req, res, 'suspend-user', { content: { user } });
          case 'confirm-suspend':
            return super.post(req, res, 'suspend-user', {
              content: { user },
              error: this.validateFields(req.body)
            });
          case 'unsuspend':
            return super.post(req, res, 'unsuspend-user', { content: { user } });
          case 'confirm-unsuspend':
            return super.post(req, res, 'unsuspend-user', {
              content: { user },
              error: this.validateFields(req.body)
            });
        }
      });
  }

  private suspendUser(req: AuthedRequest, res: Response, user: User) {
    return this.idamWrapper.editUserById(req.idam_user_dashboard_session.access_token, user.id, { active: false })
      .then(() => {
        return super.post(req, res, 'suspend-user-successful', { content: { user } } );
      })
      .catch(() => {
        const error = { userSuspendForm: { message: USER_UPDATE_FAILED_ERROR } };
        return super.post(req, res, 'suspend-user', { content: { user }, error } );
      });
  }

  private unSuspendUser(req: AuthedRequest, res: Response, user: User) {
    return this.idamWrapper.editUserById(req.idam_user_dashboard_session.access_token, user.id, { active: true })
      .then(() => {
        return super.post(req, res, 'unsuspend-user-successful', { content: { user } } );
      })
      .catch(() => {
        const error = { userSuspendForm: { message: USER_UPDATE_FAILED_ERROR } };
        return super.post(req, res, 'unsuspend-user', { content: { user }, error } );
      });
  }

  private validateFields(fields: any): PageError {
    const errors: PageError = {};
    if(fields._action === 'confirm-suspend' && isEmpty(fields.confirmSuspendRadio)) errors.confirmSuspendRadio = { message: MISSING_OPTION_ERROR };
    if(fields._action  === 'confirm-unsuspend' && isEmpty(fields.confirmUnSuspendRadio)) errors.confirmUnSuspendRadio = { message: MISSING_OPTION_ERROR };
    return errors;
  }
}
