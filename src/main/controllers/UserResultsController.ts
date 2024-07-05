import {AuthedRequest} from '../interfaces/AuthedRequest';
import {ProviderIdentity} from '../interfaces/Provider';
import {Response} from 'express';
import {
  computeTimeDifferenceInMinutes,
  convertISODateTimeToUTCFormat,
  convertISODateTimeToUTCFormatTrimSeconds,
  isEmpty,
  sortRoles
} from '../utils/utils';
import {RootController} from './RootController';
import autobind from 'autobind-decorator';
import {User} from '../interfaces/User';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import {processMfaRoleV2} from '../utils/roleUtils';
import config from 'config';
import {AccountStatus, RecordType, V2User} from '../interfaces/V2User';
const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('server');

@autobind
export class UserResultsController extends RootController {

  @asyncError
  public async get(req: AuthedRequest, res: Response) {
    return this.getUserResults(req, res);
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    return this.getUserResults(req, res);
  }

  private async getUserResults(req: AuthedRequest, res: Response) {
    const userUUID: string = req.params.userUUID || '';

    let user;
    try {
      user = await req.scope.cradle.api.getUserV2ById(userUUID);
    } catch (e) {
      return req.next();
    }

    const providerMap: Map<string, ProviderIdentity> = new Map([
      [ config.get('providers.azure.internalName'), { providerName : config.get('providers.azure.externalName'), providerIdField : config.get('providers.azure.idFieldName') }],
      [ config.get('providers.moj.internalName'),  { providerName : config.get('providers.moj.externalName'), providerIdField : config.get('providers.moj.idFieldName') }]
    ]);

    const notificationBannerMessage = this.getBannerIfRequired(user);
    const {providerName, providerIdField} = this.computeProviderIdentity(user, providerMap);
    const previousNav = req.header('Referer');

    this.preprocessSearchResults(user);
    return super.post(req, res, 'user-details', {
      content: {
        user,
        canManage: this.canManageUser(req.idam_user_dashboard_session.user, user),
        lockedMessage: this.composeLockedMessage(user),
        notificationBannerMessage: notificationBannerMessage,
        providerName: providerName,
        providerIdField: providerIdField,
        userIsActive: (user.accountStatus == AccountStatus.ACTIVE),
        userIsLocked: (user.accountStatus == AccountStatus.LOCKED),
        userIsSuspended: (user.accountStatus == AccountStatus.SUSPENDED),
        userIsArchived: (user.recordType == RecordType.ARCHIVED),
        previousNav: previousNav
      }
    });

  }

  private computeProviderIdentity(user: V2User, providerMap: Map<string, ProviderIdentity>): ProviderIdentity {
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

  private getBannerIfRequired(user: V2User): string {
    let notificationBannerMessage;
    if (user.ssoProvider?.toLowerCase().includes(config.get('providers.azure.internalName'))) {
      notificationBannerMessage = 'Please check with the eJudiciary support team to see if there are related accounts.';
    }
    if (user.recordType == RecordType.ARCHIVED) {
      if (notificationBannerMessage) {
        notificationBannerMessage = notificationBannerMessage?.trim() !== '' ? notificationBannerMessage + '\n' : notificationBannerMessage;
      }
      notificationBannerMessage = notificationBannerMessage? notificationBannerMessage + 'Archived accounts are read only.' : 'Archived accounts are read only.';
    }
    return notificationBannerMessage;
  }

  private preprocessSearchResults(user: V2User): void {
    if (!user.roleNames) {
      user.roleNames = [];
    }
    sortRoles(user.roleNames);
    user.createDate = convertISODateTimeToUTCFormat(user.createDate);
    user.lastModified = convertISODateTimeToUTCFormat(user.lastModified);
    if (user.lastLoginDate) {
      user.lastLoginDate = convertISODateTimeToUTCFormatTrimSeconds(user.lastLoginDate);
    }
    processMfaRoleV2(user);
  }

  private composeLockedMessage(user: V2User): string {
    if (user.accountStatus === AccountStatus.LOCKED) {
      logger.error('server logger: composing locked message for user id' + user.id);
      if (!isEmpty(user.accessLockedDate)) {
        const remainingTime = this.computeRemainingLockedTime(user.accessLockedDate);
        if (remainingTime > 0) {
          const lockedMessage = `This account has been temporarily locked due to multiple failed login attempts. The temporary lock will end in ${remainingTime} `;
          return remainingTime == 1 ? lockedMessage + 'minute' : lockedMessage + 'minutes';
        } else {
          return 'Account locked at ' + convertISODateTimeToUTCFormat(user.accessLockedDate) + ' due to multiple failed login attempts, but lock has now expired';
        }
      }
    }
    return '';
  }

  private computeRemainingLockedTime(accountLockedTime: string): number {
    const lockDurationMinutes : number = config.get('accounts.status.lock.durationMinutes');
    return lockDurationMinutes - computeTimeDifferenceInMinutes(new Date(), new Date(accountLockedTime));
  }

  private canManageUser(userA: User | Partial<User>, userB: V2User | Partial<V2User>): boolean {
    return userB.roleNames.every(role => userA.assignableRoles.includes(role));
  }
}
