import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import { isEmpty, isValidEmailFormat } from '../utils/utils';
import {
  duplicatedEmailError,
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_EMAIL_ERROR
} from '../utils/error';
import { SearchType } from '../utils/SearchType';
import asyncError from '../modules/error-handler/asyncErrorDecorator';

@autobind
export class AddUserDetailsController extends RootController{
  public get(req: AuthedRequest, res: Response) {
    return super.get(req, res, 'add-user-details');
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    return await this.processNewUserEmail(req, res);
  }

  private async processNewUserEmail(req: AuthedRequest, res: Response) {
    const email = req.body.email as string;
    if (isEmpty(email)) {
      return this.postError(req, res, MISSING_EMAIL_ERROR);
    } else if (!isValidEmailFormat(email)) {
      return this.postError(req, res, INVALID_EMAIL_FORMAT_ERROR);
    }

    // check if the user with the same email already exists
    const users = await req.scope.cradle.api.getUserDetails(SearchType.Email, email);
    return users.length == 0
      ? super.post(req, res, 'add-user-details', {content: {email}})
      : this.postError(req, res, duplicatedEmailError(email));
  }

  private postError(req: AuthedRequest, res: Response, errorMessage: string) {
    return super.post(req, res, 'add-users', { error: {
      email: { message: errorMessage }
    }});
  }
}
