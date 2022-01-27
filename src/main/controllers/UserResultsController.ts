import autobind from 'autobind-decorator';
import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { PageData } from '../interfaces/PageData';
import { isEmpty, sortRoles } from '../utils/utils';
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
      const result = results[0];
      sortRoles(result.roles);
      return res.render('user-details', result);
    }
    return res.render('manage-users', { search: email });
  }
}
