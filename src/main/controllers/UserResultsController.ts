import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { convertISODateTimeToUTCFormat, sortRoles } from '../utils/utils';
import { validateEmail } from '../utils/validation';
import { RootController } from './RootController';
import { NO_USER_MATCHES_ERROR, TOO_MANY_USERS_ERROR } from '../utils/error';

export class UserResultsController extends RootController {
  public async post(req: AuthedRequest, res: Response): Promise<void> {
    const email: string = req.body.email ?? '';
    const errorMessage = validateEmail(email);
    let resultsMessage;

    if (errorMessage) {
      return super.post(req, res, 'manage-users', { error: {
        email: { message: errorMessage }
      }});
    }

    const users = await req.scope.cradle.api.getUsersByEmail(email);
    if (users.length === 1) {
      const user = users[0];
      sortRoles(user.roles);
      user.createDate = convertISODateTimeToUTCFormat(user.createDate);
      user.lastModified = convertISODateTimeToUTCFormat(user.lastModified);

      return res.render('user-details', user);
    } else if (users.length > 1) {
      resultsMessage = TOO_MANY_USERS_ERROR + email;
    } else {
      resultsMessage = NO_USER_MATCHES_ERROR + email;
    }

    super.post(req, res, 'manage-users', {
      content: {
        search: email,
        result: resultsMessage
      }
    });
  }
}
