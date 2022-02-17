import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import {convertISODateTimeToUTCFormat, possiblyEmail, sortRoles} from '../utils/utils';
import {validateEmail, validateInputPresent} from '../utils/validation';
import { RootController } from './RootController';
import { NO_USER_MATCHES_ERROR, TOO_MANY_USERS_ERROR } from '../utils/error';
import autobind from 'autobind-decorator';
import {User} from '../interfaces/User';
import {SearchType} from '../utils/SearchType';

@autobind
export class UserResultsController extends RootController {
  public async post(req: AuthedRequest, res: Response) {
    const input: string = req.body.search ?? '';
    let users;
    let resultsMessage;
    let errorMessage = validateInputPresent(input);

    if (!errorMessage) {
      [users, errorMessage] = await this.searchForUser(req, input);
    }

    if (errorMessage) {
      return this.postError(req, res, errorMessage);
    }

    if (users.length === 1) {
      const user = users[0];
      this.preprocessSearchResults(user);
      return super.post(req, res, 'user-details', {content: {user}});
    }

    resultsMessage = (users.length > 1 ? TOO_MANY_USERS_ERROR : NO_USER_MATCHES_ERROR) + input;
    return super.post(req, res, 'manage-users', {
      content: {
        search: input,
        result: resultsMessage
      }
    });
  }

  private async searchForUser(req: AuthedRequest, input: string): Promise<[User[], string | void]> {
    let users: User[] = [];
    let errorMessage;
    if (possiblyEmail(input)) {
      errorMessage = validateEmail(input);
      if (!errorMessage) {
        users = await req.scope.cradle.api.getUserDetails(SearchType['Email'], input);
      }
    } else {
      users = await req.scope.cradle.api.getUserDetails(SearchType['UserId'], input);
      if (users.length === 0) {
        users = await req.scope.cradle.api.getUserDetails(SearchType['SsoId'], input);
      }
    }
    return [users, errorMessage];
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
}
