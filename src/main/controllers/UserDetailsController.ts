import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { isEmpty } from '../utils/utils';
import { PageData } from '../interfaces/PageData';
import { validateEmail } from '../utils/validation';

export class UserDetailsController {
  public get(req: AuthedRequest, res: Response): void {
    const email  = req.query.email ? req.query.email as string : '';
    const errorMessage = validateEmail(email);

    if (!isEmpty(errorMessage)) {
      const data: PageData = {
        hasError: true,
        errorMessage: errorMessage
      };
      return res.render('manage-users', data);
    }
    res.render('user-details');
  }
}
