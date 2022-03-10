import { mockResponse } from '../../utils/mockResponse';
import { IdamAPI } from '../../../../main/app/idam-api/IdamAPI';
import { mockRequest } from '../../utils/mockRequest';
import { when } from 'jest-when';
import { UserEditController } from '../../../../main/controllers/UserEditController';
import { mockRootController } from '../../utils/mockRootController';

type Mocked<T> = { [P in keyof T]: jest.Mock; };

describe('User edit controller', () => {
  mockRootController();

  let req: any;
  const res = mockResponse();
  const controller = new UserEditController();

  const mockApi: Mocked<IdamAPI> = {
    getUserById: jest.fn(),
    getUserDetails: jest.fn(),
    editUserById: jest.fn(),
    deleteUserById: jest.fn(),
    getAllRoles: jest.fn(),
    getAssignableRoles: jest.fn()
  };

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
  });

  test('Should render the edit users page', async () => {
    const postData = {
      _userId: '7',
      _action: 'edit'
    };
    const apiData = {
      id: postData._userId,
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    when(mockApi.getUserById).calledWith(postData._userId).mockReturnValue(Promise.resolve(apiData));
    req.body = postData;

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(postData._userId);
    expect(res.render).toBeCalledWith('edit-user', { content: { user: apiData } });
  });

  test('Should render the edit users page after saving', async () => {
    const postData = {
      _userId: '7',
      _action: 'save',
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
    };

    const originalUserApiData = {
      id: postData.id,
      forename: 'Tom',
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const updatedUserApiData = {
      id: postData.id,
      forename: postData.forename,
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    when(mockApi.getUserById).calledWith(postData._userId).mockReturnValue(Promise.resolve(originalUserApiData));
    when(mockApi.editUserById).calledWith(postData._userId, { forename: postData.forename }).mockReturnValue(Promise.resolve(updatedUserApiData));
    req.body = postData;

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(postData._userId);
    expect(mockApi.editUserById).toBeCalledWith(postData._userId, { forename: postData.forename });

    expect(res.render).toBeCalledWith('edit-user', { content:  { user: updatedUserApiData, 'notification': 'User saved successfully' } });
  });

  test('Should render the edit users page with validation errors after saving', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const updatedUserData = {
      forename: '',
      surname: '',
      email: originalUserData.email,
    };

    const error = {
      forename: { message: 'You must enter a forename for the user' },
      surname: { message: 'You must enter a surname for the user' }
    };


    when(mockApi.getUserById).calledWith(originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(originalUserData.id);

    expect(res.render).toBeCalledWith('edit-user', { content: { user: {...originalUserData, ...updatedUserData} }, error });
  });

  test('Should render the edit users page with errors when no fields changed', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const updatedUserData = {
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
    };

    const error = {
      userEditForm: { message: 'No changes to the user were made' },
    };


    when(mockApi.getUserById).calledWith(originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(originalUserData.id);

    expect(res.render).toBeCalledWith('edit-user', { content: { user: {...originalUserData, ...updatedUserData} }, error });
  });

  test('Should render the edit users page after there was an API issue saving', async () => {
    const postData = {
      _userId: '7',
      _action: 'save',
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
    };

    const originalUserApiData = {
      id: postData.id,
      forename: 'Tom',
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_SUPER_USER'],
    };

    const error = {
      userEditForm: { message: 'An error occurred whilst updating user ' + postData.email },
    };

    when(mockApi.getUserById).calledWith(postData._userId).mockReturnValue(Promise.resolve(originalUserApiData));
    when(mockApi.editUserById).calledWith(postData._userId, { forename: postData.forename }).mockReturnValue(Promise.reject());
    req.body = postData;

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(postData._userId);
    expect(mockApi.editUserById).toBeCalledWith(postData._userId, { forename: postData.forename });

    expect(res.render).toBeCalledWith('edit-user', { content:  { user: originalUserApiData }, error });
  });
});
