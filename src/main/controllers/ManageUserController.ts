import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { isEmpty, isValidEmailFormat, possiblyEmail } from '../utils/utils';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_INPUT_ERROR,
  NO_USER_MATCHES_ERROR,
  TOO_MANY_USERS_ERROR
} from '../utils/error';
import { USER_DETAILS_URL } from '../utils/urls';
import { User } from '../interfaces/User';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
const obfuscate = require('obfuscate-email');

@autobind
export class ManageUserController extends RootController {

  constructor(private readonly idamWrapper: IdamAPI, protected featureFlags?: FeatureFlags) {
    super(featureFlags);
  }

  public get(req: AuthedRequest, res: Response) {
    return super.get(req, res, 'manage-user');
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const input: string = req.body.search || req.body._userId || '';

    if (isEmpty(input.trim())) {
      return this.postError(req, res, MISSING_INPUT_ERROR);
    }

    const users = await this.searchForUser(req, res, input);

    if (users) {
      if (users.length === 1) {
        console.log('ManageUserController.post, found uuid: ' + users[0].id);
        return res.redirect(307, USER_DETAILS_URL.replace(':userUUID', users[0].id));
      }
      console.log('ManageUserController.post, found ' + users.length + ' result(s) for input ' + (possiblyEmail(input) ? obfuscate(input) : input));
      return this.postError(req, res, (users.length > 1 ? TOO_MANY_USERS_ERROR : NO_USER_MATCHES_ERROR) + input);
    } else {
      console.log('ManageUserController.post, found no results for input ' + (possiblyEmail(input) ? obfuscate(input) : input));
    }
  }

  private async searchForUser(req: AuthedRequest, res: Response, input: string): Promise<User[]> {
    if (possiblyEmail(input)) {
      if (!isValidEmailFormat(input)) {
        this.postError(req, res, INVALID_EMAIL_FORMAT_ERROR);
        return;
      }
      return await this.idamWrapper.searchUsersByEmail(req.idam_user_dashboard_session.access_token, input);
    }

    // only search for SSO ID if searching with the user ID does not return any result
    return await this.idamWrapper.getUserById(req.idam_user_dashboard_session.access_token, input)
      .then(user => {
        return [user];
      })
      .catch(() => {
        return this.idamWrapper.searchUsersBySsoId(req.idam_user_dashboard_session.access_token, input);
      });
  }

  private postError(req: AuthedRequest, res: Response, errorMessage: string) {
    return super.post(req, res, 'manage-user', {
      error: {
        search: {message: errorMessage}
      }
    });
  }
}
