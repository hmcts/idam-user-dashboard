import { UserResultsController } from '../../../../main/controllers/UserResultsController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_INPUT_ERROR,
  NO_USER_MATCHES_ERROR,
  TOO_MANY_USERS_ERROR
} from '../../../../main/utils/error';
import { when } from 'jest-when';
import {SearchType} from '../../../../main/utils/SearchType';
import { mockRootController } from '../../utils/mockRootController';


describe('User results controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();

  const mockApi = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    getUserDetails: () => {}
  };
  mockApi.getUserDetails = jest.fn();

  const controller = new UserResultsController();
  const email = 'john.smith@test.com';
  const userId = '123';
  const userId2 = '234';
  const ssoId = '456';
  const ssoId2 = '567';

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the user details page when searching with a valid email', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      }
    ];
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.Email, email).mockReturnValue(results);

    req.body.search = email;
    req.scope.cradle.api = mockApi;
    req.session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', { content: { user: results[0], showDelete: false } });
  });

  test('Should render the user details page when searching with a valid user ID', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      }
    ];
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.UserId, userId).mockReturnValue(results);
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.SsoId, userId).mockReturnValue([]);

    req.body.search = userId;
    req.scope.cradle.api = mockApi;
    req.session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', { content: { user: results[0], showDelete: false } });
  });

  test('Should render the user details page when searching with a valid SSO ID', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      }
    ];
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.UserId, ssoId).mockReturnValue([]);
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.SsoId, ssoId).mockReturnValue(results);

    req.body.search = ssoId;
    req.scope.cradle.api = mockApi;
    req.session = { user: { assignableRoles: [] } };
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('user-details', { content: { user: results[0], showDelete: false } });
  });

  test('Should render the manage users page when searching with a non-existent email', async () => {
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.Email, email).mockReturnValue([]);

    req.body.search = email;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('manage-users', { content: { search: email, result: NO_USER_MATCHES_ERROR + email } });
  });

  test('Should render the manage users page when searching with a non-existent ID', async () => {
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.UserId, userId).mockReturnValue([]);
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.SsoId, userId).mockReturnValue([]);

    req.body.search = userId;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('manage-users', { content: { search: userId, result: NO_USER_MATCHES_ERROR + userId } });
  });

  test('Should render the manage users page when more than one emails matches the search input', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      },
      {
        id: userId2,
        forename: 'J',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_ADMIN_USER'],
        ssoId: userId
      }
    ];
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.Email, email).mockReturnValue(results);

    req.body.search = email;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('manage-users', { content: { search: email, result: TOO_MANY_USERS_ERROR + email } });
  });

  test('Should render the manage users page when more than one user IDs matches the search input', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      },
      {
        id: userId,
        forename: 'Mike',
        surname: 'Green',
        email: email,
        active: false,
        roles: ['IDAM_ADMIN_USER'],
        ssoId: ssoId2
      }
    ];
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.UserId, userId).mockReturnValue(results);

    req.body.search = userId;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('manage-users', { content: { search: userId, result: TOO_MANY_USERS_ERROR + userId } });
  });

  test('Should render the manage users page when more than one SSO IDs matches the search input', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      },
      {
        id: userId2,
        forename: 'Mike',
        surname: 'Green',
        email: email,
        active: false,
        roles: ['IDAM_ADMIN_USER'],
        ssoId: ssoId
      }
    ];
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.UserId, ssoId).mockReturnValue([]);
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.SsoId, ssoId).mockReturnValue(results);

    req.body.search = ssoId;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('manage-users', { content: { search: ssoId, result: TOO_MANY_USERS_ERROR + ssoId } });
  });

  test('Should render the manage users page with error when searching with empty input', async () => {
    req.body.search = '';
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('manage-users', { error: { search: { message: MISSING_INPUT_ERROR } } });
  });

  test('Should render the manage users page with error when searching with email with invalid format', async () => {
    req.body.search = 'test@test';
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('manage-users', { error: { search: { message: INVALID_EMAIL_FORMAT_ERROR } }});
  });
});
