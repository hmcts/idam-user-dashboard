import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { hasProperty } from '../utils/utils';
import { PageData } from '../interfaces/PageData';
import { missingOption } from '../utils/error';

export class UserOptionController {
  public get(req: AuthedRequest, res: Response): void {
    res.render('user-option');
  }

  public post(req: AuthedRequest, res: Response): void {
    if (!hasProperty(req.body, 'userAction')) {
      const data: PageData = {
        hasError: true,
        errorMessage: missingOption
      };
      return res.render('user-option', data);
    }

    const userAction = req.body.userAction as string;
    if (userAction === 'manage-users') {
      return res.redirect('/manage-users');
    }
    return res.redirect('/add-users');
  }
}
