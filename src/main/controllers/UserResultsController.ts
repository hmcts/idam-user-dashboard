import autobind from 'autobind-decorator';
import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { isEmpty } from '../utils/utils';
import { PageData } from '../interfaces/PageData';
import { validateEmail } from '../utils/validation';

@autobind
export class UserResultsController {
  public async get(req: AuthedRequest, res: Response): Promise<void> {
    const email  = req.query.email ? req.query.email as string : '';
    const errorMessage = validateEmail(email);

    if (!isEmpty(errorMessage)) {
      const data: PageData = {
        hasError: true,
        errorMessage: errorMessage
      };
      return res.render('manage-users', data);
    }

    const results = await req.scope.cradle.api.getUsersByEmail(email);
    if (results.length) {
      return res.render('user-details', results[0]);
    }
    return res.render('manage-users', { search: email});
  }
}
