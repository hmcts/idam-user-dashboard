import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockRootController } from '../../utils/mockRootController';
import { UserRemoveSsoController } from '../../../../main/controllers/UserRemoveSsoController';
import { mockApi } from '../../utils/mockApi';
import { when } from 'jest-when';
import { MISSING_OPTION_ERROR, USER_REMOVE_SSO_ERROR } from '../../../../main/utils/error';
import {  USER_DETAILS_URL } from '../../../../main/utils/urls';

describe('User remove SSO controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const controller = new UserRemoveSsoController();
  const testToken = 'test-token';

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = {access_token: testToken};
  });

  test('Should render the user remove sso page', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('remove-sso-user', { content: { user: userData } });
  });

  test('Should redirect to the user manage page after removing sso for user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-remove-sso', confirmSso: 'true' };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.removeSsoById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve());

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('remove-sso-user-successful', { content: { user: userData } });
  });

  test('Should redirect to the user details page after cancelling removing sso for user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-remove-sso', confirmSso: 'false' };
    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(307, USER_DETAILS_URL.replace(':userUUID', '1'));
  });

  test('Should render the remove sso page with validation errors after confirming', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = { confirmRadio: { message: MISSING_OPTION_ERROR } };

    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    req.body = { _userId: userData.id, _action: 'confirm-remove-sso' };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, userData.id);
    expect(res.render).toBeCalledWith('remove-sso-user', { content: { user: userData }, error });
  });

  test('Should render the remove sso page after there was an API issue', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = { userRemoveSsoForm: { message: USER_REMOVE_SSO_ERROR } };

    when(mockApi.getUserById).calledWith(testToken, userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.removeSsoById).calledWith(testToken, userData.id).mockReturnValue(Promise.reject('Failed'));

    req.body = { _userId: userData.id, _action: 'confirm-remove-sso', confirmSso: 'true' };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, userData.id);
    expect(res.render).toBeCalledWith('remove-sso-user', { content: { user: userData }, error });
  });
});
