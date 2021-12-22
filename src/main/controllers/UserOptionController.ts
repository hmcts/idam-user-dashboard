import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { hasProperty } from '../utils/utils';
import { PageData } from '../interfaces/PageData';
import { MISSING_OPTION_ERROR } from '../utils/error';
import { ADD_USERS_URL, MANAGER_USERS_URL } from '../utils/urls';

export class UserOptionController {
  public get(req: AuthedRequest, res: Response): void {
    res.render('user-option');
  }

  public post(req: AuthedRequest, res: Response): void {
    if (!hasProperty(req.body, 'userAction')) {
      const data: PageData = {
        hasError: true,
        errorMessage: MISSING_OPTION_ERROR
      };
      return res.render('user-option', data);
    }

    const userAction = req.body.userAction as string;
    if (userAction === 'manage-users') {
      return res.redirect(MANAGER_USERS_URL);
    }
    return res.redirect(ADD_USERS_URL);
  }
}
