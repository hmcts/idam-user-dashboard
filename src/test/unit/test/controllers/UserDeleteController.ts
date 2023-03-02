import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockRootController } from '../../utils/mockRootController';
import { UserDeleteController } from '../../../../main/controllers/UserDeleteController';
import { when } from 'jest-when';
import { MISSING_OPTION_ERROR, USER_DELETE_FAILED_ERROR } from '../../../../main/utils/error';
import { USER_DETAILS_URL } from '../../../../main/utils/urls';
import { mockApi } from '../../utils/mockApi';

describe('User delete controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const controller = new UserDeleteController();

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
  });

  test('Should render the user delete page', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id };
    when(mockApi.getUserById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('delete-user', { content: { user: userData } });
  });

  test('Should redirect to the user manage page after deleting user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-delete', confirmDelete: 'true' };
    when(mockApi.getUserById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.deleteUserById).calledWith(userData.id).mockReturnValue(Promise.resolve());

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('delete-user-successful', { content: { user: userData } });
  });

  test('Should redirect to the user details page after cancelling delete user', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    req.body = { _userId: userData.id, _action: 'confirm-delete', confirmDelete: 'false' };
    when(mockApi.getUserById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));

    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(307, USER_DETAILS_URL.replace(':userUUID', '1'));
  });

  test('Should render the delete user page with validation errors after confirming', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = { confirmRadio: { message: MISSING_OPTION_ERROR } };

    when(mockApi.getUserById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));
    req.body = { _userId: userData.id, _action: 'confirm-delete' };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(userData.id);
    expect(res.render).toBeCalledWith('delete-user', { content: { user: userData }, error });
  });

  test('Should render the delete user page after there was an API issue', async () => {
    const userData = {
      id: 1,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = { userDeleteForm: { message: USER_DELETE_FAILED_ERROR } };

    when(mockApi.getUserById).calledWith(userData.id).mockReturnValue(Promise.resolve(userData));
    when(mockApi.deleteUserById).calledWith(userData.id).mockReturnValue(Promise.reject('Failed'));

    req.body = { _userId: userData.id, _action: 'confirm-delete', confirmDelete: 'true' };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(userData.id);
    expect(res.render).toBeCalledWith('delete-user', { content: { user: userData }, error });
  });
});
