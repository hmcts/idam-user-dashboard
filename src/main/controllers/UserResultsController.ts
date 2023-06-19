import { AuthedRequest } from '../interfaces/AuthedRequest';
import { ProviderIdentity } from '../interfaces/Provider';
import { Response } from 'express';
import {
  computeTimeDifferenceInMinutes,
  convertISODateTimeToUTCFormat,
  isEmpty,
  isValidEmailFormat,
  possiblyEmail,
  sortRoles
} from '../utils/utils';
import { RootController } from './RootController';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_INPUT_ERROR,
  NO_USER_MATCHES_ERROR,
  TOO_MANY_USERS_ERROR
} from '../utils/error';
import autobind from 'autobind-decorator';
import { User } from '../interfaces/User';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { processMfaRole } from '../utils/roleUtils';
import config from 'config';

@autobind
export class UserResultsController extends RootController {

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const input: string = req.body.search || req.body._userId || '';

    if (isEmpty(input.trim())) {
      return this.postError(req, res, MISSING_INPUT_ERROR);
    }
    const users = await this.searchForUser(req, res, input);

    if (users) {
      if (users.length === 1) {
        const user = await req.scope.cradle.api.getUserById(users[0].id);

        const providerMap: Map<string, ProviderIdentity> = new Map([
          [ config.get('providers.azure.internalName'), { providerName : config.get('providers.azure.externalName'), providerIdField : config.get('providers.azure.idFieldName') }],
          [ config.get('providers.moj.internalName'),  { providerName : config.get('providers.moj.externalName'), providerIdField : config.get('providers.moj.idFieldName') }]
        ]);

        const notificationBannerMessage = this.getBannerIfRequired(user);
        const {providerName, providerIdField} = this.computeProviderIdentity(user, providerMap);

        this.preprocessSearchResults(user);
        return super.post(req, res, 'user-details', {
          content: {
            user,
            canManage: this.canManageUser(req.idam_user_dashboard_session.user, user),
            lockedMessage: this.composeLockedMessage(user),
            notificationBannerMessage: notificationBannerMessage,
            providerName: providerName,
            providerIdField: providerIdField
          }
        });
      }
      return this.postError(req, res, (users.length > 1 ? TOO_MANY_USERS_ERROR : NO_USER_MATCHES_ERROR) + input);
    }
  }

  private computeProviderIdentity(user: User, providerMap: Map<string, ProviderIdentity>): ProviderIdentity {
    let providerName;
    let providerIdField;
    if (user.ssoProvider) {
      if (providerMap.has(user.ssoProvider)) {
        providerName = providerMap.get(user.ssoProvider).providerName;
        providerIdField = providerMap.get(user.ssoProvider).providerIdField;
      } else {
        providerName = user.ssoProvider;
        providerIdField = 'IdP User ID';
      }
    } else {
      providerName = 'IDAM';
    }
    return { providerName, providerIdField };
  }

  private getBannerIfRequired(user: User): string {
    let notificationBannerMessage;
    if (user.ssoProvider && user.ssoProvider.toLowerCase().includes(config.get('providers.azure.internalName'))) {
      notificationBannerMessage = 'Please check with the eJudiciary support team to see if there are related accounts.';
    }
    return notificationBannerMessage;
  }

  private async searchForUser(req: AuthedRequest, res: Response, input: string): Promise<User[]> {
    if (possiblyEmail(input)) {
      if (!isValidEmailFormat(input)) {
        this.postError(req, res, INVALID_EMAIL_FORMAT_ERROR);
        return;
      }
      return await req.scope.cradle.api.searchUsersByEmail(input);
    }

    // only search for SSO ID if searching with the user ID does not return any result
    return await req.scope.cradle.api.getUserById(input)
      .then(user => { return [user]; })
      .catch(() => { return req.scope.cradle.api.searchUsersBySsoId(input); });
  }

  private postError(req: AuthedRequest, res: Response, errorMessage: string) {
    return super.post(req, res, 'manage-user', {
      error: {
        search: {message: errorMessage}
      }
    });
  }

  private preprocessSearchResults(user: User): void {
    sortRoles(user.roles);
    user.createDate = convertISODateTimeToUTCFormat(user.createDate);
    user.lastModified = convertISODateTimeToUTCFormat(user.lastModified);
    processMfaRole(user);
  }

  private composeLockedMessage(user: User): string {
    if (user.locked) {
      const remainingTime = isEmpty(user.pwdAccountLockedTime) ? 0 : this.computeRemainingLockedTime(user.pwdAccountLockedTime);
      if (remainingTime > 0) {
        const lockedMessage = `This account has been temporarily locked due to multiple failed login attempts. The temporary lock will end in ${remainingTime} `;
        return remainingTime == 1 ? lockedMessage + 'minute' : lockedMessage + 'minutes';
      }
    }
    return '';
  }

  private computeRemainingLockedTime(accountLockedTime: string): number {
    return 60 - computeTimeDifferenceInMinutes(new Date(), new Date(accountLockedTime));
  }

  private canManageUser(userA: User | Partial<User>, userB: User | Partial<User>): boolean {
    return userB.roles.every(role => userA.assignableRoles.includes(role));
  }
}
