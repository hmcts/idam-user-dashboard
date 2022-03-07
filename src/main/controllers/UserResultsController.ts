import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { convertISODateTimeToUTCFormat, isEmpty, isValidEmailFormat, possiblyEmail, sortRoles } from '../utils/utils';
import { RootController } from './RootController';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_INPUT_ERROR,
  NO_USER_MATCHES_ERROR,
  TOO_MANY_USERS_ERROR
} from '../utils/error';
import autobind from 'autobind-decorator';
import { User } from '../interfaces/User';
import { SearchType } from '../utils/SearchType';
import asyncError from '../modules/error-handler/asyncErrorDecorator';

@autobind
export class UserResultsController extends RootController {
  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const input: string = req.body.search || req.body._userId || '';

    if (isEmpty(input)) {
      return this.postError(req, res, MISSING_INPUT_ERROR);
    }
    const users = await this.searchForUser(req, res, input);

    if (users) {
      if (users.length === 1) {
        const user = users[0];
        this.preprocessSearchResults(user);
        return super.post(req, res, 'user-details', {
          content: { user, showDelete: this.canDeleteUser(req.session.user, user)}
        });
      }

      return super.post(req, res, 'manage-users', {
        content: {
          search: input,
          result: (users.length > 1 ? TOO_MANY_USERS_ERROR : NO_USER_MATCHES_ERROR) + input
        }
      });
    }
  }

  private async searchForUser(req: AuthedRequest, res: Response, input: string): Promise<User[]> {
    if (possiblyEmail(input)) {
      if (!isValidEmailFormat(input)) {
        this.postError(req, res, INVALID_EMAIL_FORMAT_ERROR);
        return;
      }
      return await req.scope.cradle.api.getUserDetails(SearchType['Email'], input);
    }

    const users = await req.scope.cradle.api.getUserDetails(SearchType['UserId'], input);
    if (users.length > 0) {
      return users;
    }

    // only search for SSO ID if searching with the user ID does not return any result
    return await req.scope.cradle.api.getUserDetails(SearchType['SsoId'], input);
  }

  private postError(req: AuthedRequest, res: Response, errorMessage: string) {
    return super.post(req, res, 'manage-users', { error: {
      search: { message: errorMessage }
    }});
  }

  private preprocessSearchResults(user: User): void {
    sortRoles(user.roles);
    user.createDate = convertISODateTimeToUTCFormat(user.createDate);
    user.lastModified = convertISODateTimeToUTCFormat(user.lastModified);
  }

  private canDeleteUser(userA: User | Partial<User>, userB: User | Partial<User>): boolean {
    return userB.roles.every(role => userA.assignableRoles.includes(role));
  }
}
