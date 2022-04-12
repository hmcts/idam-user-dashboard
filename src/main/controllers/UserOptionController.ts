import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { hasProperty } from '../utils/utils';
import { MISSING_OPTION_ERROR } from '../utils/error';
import { ADD_USER_URL, MANAGER_USER_URL } from '../utils/urls';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';

@autobind
export class UserOptionController extends RootController {
  public get(req: AuthedRequest, res: Response) {
    return super.get(req, res,'user-option');
  }

  public post(req: AuthedRequest, res: Response) {
    if (!hasProperty(req.body, 'userAction')) {
      return super.post(req, res, 'user-option', { error: {
        userAction: { message: MISSING_OPTION_ERROR }
      }});
    }

    const userAction = req.body.userAction as string;
    if (userAction === 'manage-user') {
      return res.redirect(MANAGER_USER_URL);
    }
    return res.redirect(ADD_USER_URL);
  }
}
