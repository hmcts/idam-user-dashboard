import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { convertISODateTimeToUTCFormat, sortRoles } from '../utils/utils';
import { validateEmail } from '../utils/validation';
import { RootController } from './RootController';

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
      resultsMessage = `More than one user matches your search for: ${email}. Please contact the system owner for support.`;
    } else {
      resultsMessage = `No user matches your search for: ${email}`;
    }

    super.post(req, res, 'manage-users', {
      content: {
        search: email,
        result: resultsMessage
      }
    });
  }
}
