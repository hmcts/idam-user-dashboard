import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockRootController } from '../../utils/mockRootController';
import { UserDeleteController } from '../../../../main/controllers/UserDeleteController';
import { when } from 'jest-when';
import { MISSING_OPTION_ERROR, USER_DELETE_FAILED_ERROR } from '../../../../main/utils/error';
import { USER_DETAILS_URL } from '../../../../main/utils/urls';
import { mockApi } from '../../utils/mockApi';
import { IdamAPI } from '../../../../main/app/idam-api/IdamAPI';

const expectForbidden = (req: any, res: any) => {
  expect(req.next).toHaveBeenCalledTimes(1);
  expect(req.next.mock.calls[0][0]).toEqual(expect.objectContaining({ status: 403 }));
  expect(res.render).not.toHaveBeenCalled();
};

describe('User delete controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const controller = new UserDeleteController(mockApi as unknown as IdamAPI);
  const testToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    req.idam_user_dashboard_session = {access_token: testToken, user: { assignableRoles: ['IDAM_SUPER_USER'] }};
  });

  test('Should render the user delete page', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roleNames: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id };
    when(mockApi.getUserV2ById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('delete-user', { content: { user: userData } });
  });

  test('Should redirect to the user manage page after deleting user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roleNames: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-delete', confirmDelete: 'true' };
    when(mockApi.getUserV2ById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.deleteUserById).calledWith(userData.id).mockReturnValue(Promise.resolve());

    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('delete-user-successful', { content: { user: userData } });
  });

  test('Should redirect to the user details page after cancelling delete user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roleNames: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-delete', confirmDelete: 'false' };
    when(mockApi.getUserV2ById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.redirect).toHaveBeenCalledWith(307, USER_DETAILS_URL.replace(':userUUID', '1'));
  });

  test('Should reject rendering the delete page when the user has unmanageable roles', async () => {
    const localRes = mockResponse();
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roleNames: ['IDAM_ADMIN_USER'],
    };

    req.next = jest.fn();
    req.idam_user_dashboard_session = { access_token: testToken, user: { assignableRoles: ['IDAM_SUPER_USER'] } };
    req.body = { _userId: userData.id };
    when(mockApi.getUserV2ById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, localRes);

    expectForbidden(req, localRes);
  });

  test('Should reject deleting when the user has unmanageable roles', async () => {
    const localRes = mockResponse();
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roleNames: ['IDAM_ADMIN_USER'],
    };

    req.next = jest.fn();
    req.idam_user_dashboard_session = { access_token: testToken, user: { assignableRoles: ['IDAM_SUPER_USER'] } };
    req.body = { _userId: userData.id, _action: 'confirm-delete', confirmDelete: 'true' };
    when(mockApi.getUserV2ById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, localRes);

    expect(mockApi.deleteUserById).not.toHaveBeenCalled();
    expectForbidden(req, localRes);
  });

  test('Should allow deleting when the only unassignable V1 difference is idam-mfa-disabled', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roleNames: ['IDAM_SUPER_USER', 'idam-mfa-disabled'],
    };

    req.body = { _userId: userData.id };
    when(mockApi.getUserV2ById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);

    expect(res.render).toHaveBeenCalledWith('delete-user', {
      content: {
        user: expect.objectContaining({
          id: userData.id,
          forename: userData.forename,
          surname: userData.surname,
          email: userData.email,
          roleNames: ['IDAM_SUPER_USER'],
          multiFactorAuthentication: false
        })
      }
    });
  });

  test('Should render the delete user page with validation errors after confirming', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roleNames: ['IDAM_SUPER_USER'],
    };

    const error = { confirmRadio: { message: MISSING_OPTION_ERROR } };

    when(mockApi.getUserV2ById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));
    req.body = { _userId: userData.id, _action: 'confirm-delete' };

    await controller.post(req, res);
    expect(mockApi.getUserV2ById).toHaveBeenCalledWith(userData.id);
    expect(res.render).toHaveBeenCalledWith('delete-user', { content: { user: userData }, error });
  });

  test('Should render the delete user page after there was an API issue', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roleNames: ['IDAM_SUPER_USER'],
    };

    const error = { userDeleteForm: { message: USER_DELETE_FAILED_ERROR } };

    when(mockApi.getUserV2ById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.deleteUserById).calledWith(userData.id).mockReturnValue(Promise.reject('Failed'));

    req.body = { _userId: userData.id, _action: 'confirm-delete', confirmDelete: 'true' };

    await controller.post(req, res);
    expect(mockApi.getUserV2ById).toHaveBeenCalledWith(userData.id);
    expect(res.render).toHaveBeenCalledWith('delete-user', { content: { user: userData }, error });
  });
});
