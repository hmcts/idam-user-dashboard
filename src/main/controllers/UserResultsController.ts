import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { PageData } from '../interfaces/PageData';
import { convertISODateTimeToUTCFormat, isEmpty, sortRoles } from '../utils/utils';
import { validateEmail } from '../utils/validation';

export class UserResultsController {
  public async post(req: AuthedRequest, res: Response): Promise<void> {
    const email  = req.body.email ? req.body.email as string : '';
    const errorMessage = validateEmail(email);

    if (!isEmpty(errorMessage)) {
      const data: PageData = {
        hasError: true,
        errorMessage: errorMessage
      };
      return res.render('manage-users', data);
    }

    const users = await req.scope.cradle.api.getUsersByEmail(email);
    if (users.length === 1) {
      const user = users[0];
      sortRoles(user.roles);
      user.createDate = convertISODateTimeToUTCFormat(user.createDate);
      user.lastModified = convertISODateTimeToUTCFormat(user.lastModified);
      return res.render('user-details', user);
    }
    // If the API returns more than one search results unexpectedly, we return an error
    // in the manage-users page
    return res.render('manage-users', {
      search: email,
      result: users
    });
  }
}
