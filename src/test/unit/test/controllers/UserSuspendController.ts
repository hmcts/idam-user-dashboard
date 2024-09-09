import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockRootController } from '../../utils/mockRootController';
import { when } from 'jest-when';
import { MISSING_OPTION_ERROR, USER_UPDATE_FAILED_ERROR } from '../../../../main/utils/error';
import { USER_DETAILS_URL } from '../../../../main/utils/urls';
import { UserSuspendController } from '../../../../main/controllers/UserSuspendController';
import { mockApi } from '../../utils/mockApi';

describe('User suspend controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const controller = new UserSuspendController();
  const testToken = 'test-token';

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = {access_token: testToken};
  });

  test('Should render the user suspend page', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'suspend' };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('suspend-user', { content: { user: userData } });
  });

  test('Should render the user suspend successful page after suspending a user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-suspend', confirmSuspendRadio: 'true' };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.editUserById).calledWith(testToken, userData.id, { active: false }).mockReturnValue(Promise.resolve());

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('suspend-user-successful', { content: { user: userData } });
  });

  test('Should redirect to the user details page after cancelling suspend user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-suspend', confirmSuspendRadio: 'false' };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(307, USER_DETAILS_URL.replace(':userUUID', '1'));
  });

  test('Should render the suspend user page with validation errors after confirming', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = { confirmSuspendRadio: { message: MISSING_OPTION_ERROR } };

    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    req.body = { _userId: userData.id, _action: 'confirm-suspend' };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, userData.id);
    expect(res.render).toBeCalledWith('suspend-user', { content: { user: userData }, error });
  });

  test('Should render the suspend user page after there was an API issue', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = { userSuspendForm: { message: USER_UPDATE_FAILED_ERROR } };

    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.editUserById).calledWith(testToken, userData.id, { active: false }).mockReturnValue(Promise.reject('Failed'));

    req.body = { _userId: userData.id, _action: 'confirm-suspend', confirmSuspendRadio: 'true' };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, userData.id);
    expect(res.render).toBeCalledWith('suspend-user', { content: { user: userData }, error });
  });

  test('Should render the user unsuspend page', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: false,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'unsuspend' };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('unsuspend-user', { content: { user: userData } });
  });

  test('Should render the user unsuspend successful page after unsuspending a user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: false,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-unsuspend', confirmUnSuspendRadio: 'true' };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.editUserById).calledWith(testToken, userData.id, { active: true }).mockReturnValue(Promise.resolve());

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('unsuspend-user-successful', { content: { user: userData } });
  });

  test('Should redirect to the user details page after cancelling unsuspend user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: false,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'un-confirm-suspend', confirmSuspendRadio: 'false' };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(307, USER_DETAILS_URL.replace(':userUUID', '1'));
  });

  test('Should render the unsuspend user page with validation errors after confirming', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: false,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = { confirmUnSuspendRadio: { message: MISSING_OPTION_ERROR } };

    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    req.body = { _userId: userData.id, _action: 'confirm-unsuspend' };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, userData.id);
    expect(res.render).toBeCalledWith('unsuspend-user', { content: { user: userData }, error });
  });

  test('Should render the unsuspend user page after there was an API issue', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: false,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = { userSuspendForm: { message: USER_UPDATE_FAILED_ERROR } };

    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.editUserById).calledWith(testToken, userData.id, { active: true }).mockReturnValue(Promise.reject('Failed'));

    req.body = { _userId: userData.id, _action: 'confirm-unsuspend', confirmUnSuspendRadio: 'true' };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, userData.id);
    expect(res.render).toBeCalledWith('unsuspend-user', { content: { user: userData }, error });
  });
});
