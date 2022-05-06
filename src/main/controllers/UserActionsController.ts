import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { EDIT_USER_URL, USER_DELETE_URL, USER_SUSPEND_URL } from '../utils/urls';

@autobind
export class UserActionsController extends RootController{

  @asyncError
  public post(req: AuthedRequest, res: Response) {
    switch (req.body._action) {
      case 'edit':
        return res.redirect(307, EDIT_USER_URL);
      case 'suspend':
      case 'unsuspend':
        return res.redirect(307, USER_SUSPEND_URL);
      case 'delete':
        return res.redirect(307, USER_DELETE_URL);
    }
  }
}
