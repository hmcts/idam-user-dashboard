import { UserResultsController } from '../../../../main/controllers/UserResultsController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { when } from 'jest-when';
import { mockRootController } from '../../utils/mockRootController';
import { mockApi } from '../../utils/mockApi';
import config from 'config';
import {AccountStatus, RecordType} from '../../../../main/interfaces/V2User';
jest.mock('config');

describe('User results controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();

  when(config.get).calledWith('providers.azure.internalName').mockReturnValue('azure');
  when(config.get).calledWith('providers.azure.externalName').mockReturnValue('eJudiciary.net');
  when(config.get).calledWith('providers.azure.idFieldName').mockReturnValue('eJudiciary User ID');
  when(config.get).calledWith('providers.moj.internalName').mockReturnValue('moj');
  when(config.get).calledWith('providers.moj.externalName').mockReturnValue('MOJ/Justice.gov.uk');
  when(config.get).calledWith('providers.moj.idFieldName').mockReturnValue('MOJ User ID');

  const controller = new UserResultsController();
  const email = 'john.smith@test.com';
  const userId = '123';
  const ssoId = '456';

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the user details page with notification banner', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: true,
        ssoId: ssoId,
        ssoProvider: 'azure',
        createDate: '',
        lastModified: ''
      }
    ];

    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(results[0]);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: results[0],
        canManage: false,
        providerIdField: 'eJudiciary User ID',
        providerName: 'eJudiciary.net',
        notificationBannerMessage: 'Please check with the eJudiciary support team to see if there are related accounts.',
        lockedMessage: '',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the stale user details page with notification banner', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.ARCHIVED,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: true,
        ssoId: ssoId,
        ssoProvider: 'azure',
        createDate: '',
        lastModified: ''
      }
    ];

    when(mockApi.searchUsersByEmail).calledWith(email).mockResolvedValue(results);
    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(results[0]);

    req.params = { userUUID: userId };
    req.body.search = email;
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: results[0],
        canManage: false,
        providerIdField: 'eJudiciary User ID',
        providerName: 'eJudiciary.net',
        notificationBannerMessage: 'Please check with the eJudiciary support team to see if there are related accounts.' + '\n'
        + 'Archived accounts are read only.',
        lockedMessage: '',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: true
      }
    });
  });

  test('Should render the user details page when searching with a valid email', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: true,
        ssoId: ssoId,
        createDate: '',
        lastModified: ''
      }
    ];

    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(results[0]);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: results[0],
        canManage: false,
        lockedMessage: '',
        providerName: 'IDAM',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the user details page when searching with a valid email and SSO Provider', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: true,
        ssoProvider: 'azure',
        ssoId: ssoId,
        createDate: '',
        lastModified: ''
      }
    ];

    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(results[0]);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: results[0],
        canManage: false,
        lockedMessage: '',
        providerName: 'eJudiciary.net',
        notificationBannerMessage: 'Please check with the eJudiciary support team to see if there are related accounts.',
        providerIdField: 'eJudiciary User ID',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the default provider fields with unrecognised provider name', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: true,
        ssoProvider: 'unknown',
        ssoId: ssoId,
        createDate: '',
        lastModified: ''
      }
    ];

    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(results[0]);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: results[0],
        canManage: false,
        lockedMessage: '',
        providerName: 'unknown',
        providerIdField: 'IdP User ID',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the default provider name when no SSO provider present', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: true,
        createDate: '',
        lastModified: ''
      }
    ];

    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(results[0]);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: results[0],
        canManage: false,
        lockedMessage: '',
        providerName: 'IDAM',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the user details page when searching with a valid user ID', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: true,
        ssoId: ssoId,
        createDate: '',
        lastModified: ''
      }
    ];

    when(mockApi.getUserV2ById).calledWith(userId).mockReturnValue(results[0]);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: results[0],
        canManage: false,
        lockedMessage: '',
        providerName: 'IDAM',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the user details page when searching with a valid SSO ID', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: true,
        ssoId: ssoId,
        createDate: '',
        lastModified: ''
      }
    ];

    when(mockApi.getUserById).calledWith(ssoId).mockReturnValue([]);
    when(mockApi.getUserV2ById).calledWith(userId).mockReturnValue(results[0]);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details',{
      content: {
        user: results[0],
        canManage: false,
        lockedMessage: '',
        providerName: 'IDAM',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the user details page when searching for a user with idam-mfa-disabled role', async () => {
    const users = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER', 'idam-mfa-disabled'],
        ssoId: ssoId,
        createDate: '',
        lastModified: ''
      }
    ];

    const expectedResults = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        accountStatus: AccountStatus.ACTIVE,
        recordType: RecordType.LIVE,
        roleNames: ['IDAM_SUPER_USER'],
        multiFactorAuthentication: false,
        ssoId: ssoId,
        createDate: '',
        lastModified: ''
      }
    ];
    when(mockApi.getUserV2ById).calledWith(userId).mockReturnValue(users[0]);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: expectedResults[0],
        canManage: false,
        lockedMessage: '',
        providerName: 'IDAM',
        userIsActive: true,
        userIsLocked: false,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the user details page when searching for a locked user', async () => {

    const currentTime = new Date();
    const pwdAccountLockedTime = new Date(currentTime);
    pwdAccountLockedTime.setMinutes(pwdAccountLockedTime.getMinutes() - 2);

    const getUserByIdResult = {
      id: userId,
      forename: 'John',
      surname: 'Smith',
      email: email,
      accountStatus: AccountStatus.LOCKED,
      recordType: RecordType.LIVE,
      accessLockedDate: pwdAccountLockedTime,
      roleNames: ['IDAM_SUPER_USER'],
      multiFactorAuthentication: true,
      ssoId: ssoId,
      createDate: '',
      lastModified: ''
    };

    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(getUserByIdResult);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: getUserByIdResult,
        canManage: false,
        providerName: 'IDAM',
        lockedMessage: 'This account has been temporarily locked due to multiple failed login attempts. The temporary lock will end in 58 minutes',
        userIsActive: false,
        userIsLocked: true,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the user details page when searching for a locked user which will be unlocked in a minute', async () => {

    const currentTime = new Date();
    const pwdAccountLockedTime = new Date(currentTime);
    pwdAccountLockedTime.setMinutes(pwdAccountLockedTime.getMinutes() - 59);

    const getUserByIdResult = {
      id: userId,
      forename: 'John',
      surname: 'Smith',
      email: email,
      accountStatus: AccountStatus.LOCKED,
      recordType: RecordType.LIVE,
      accessLockedDate: pwdAccountLockedTime,
      roleNames: ['IDAM_SUPER_USER'],
      multiFactorAuthentication: true,
      ssoId: ssoId,
      createDate: '',
      lastModified: ''
    };

    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(getUserByIdResult);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: getUserByIdResult,
        canManage: false,
        providerName: 'IDAM',
        lockedMessage: 'This account has been temporarily locked due to multiple failed login attempts. The temporary lock will end in 1 minute',
        userIsActive: false,
        userIsLocked: true,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });

  test('Should render the user details page when searching for a locked user which is close to being unlocked', async () => {

    const currentTime = new Date();
    const pwdAccountLockedTime = new Date(currentTime);
    pwdAccountLockedTime.setMinutes(pwdAccountLockedTime.getMinutes() - 59);
    pwdAccountLockedTime.setSeconds(pwdAccountLockedTime.getSeconds() - 50);

    const getUserByIdResult = {
      id: userId,
      forename: 'John',
      surname: 'Smith',
      email: email,
      accountStatus: AccountStatus.LOCKED,
      recordType: RecordType.LIVE,
      accessLockedDate: pwdAccountLockedTime,
      roleNames: ['IDAM_SUPER_USER'],
      multiFactorAuthentication: true,
      ssoId: ssoId,
      createDate: '',
      lastModified: ''
    };

    when(mockApi.getUserV2ById).calledWith(userId).mockResolvedValue(getUserByIdResult);

    req.params = { userUUID: userId };
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', {
      content: {
        user: getUserByIdResult,
        canManage: false,
        lockedMessage: '',
        providerName: 'IDAM',
        userIsActive: false,
        userIsLocked: true,
        userIsSuspended: false,
        userIsArchived: false
      }
    });
  });
});
