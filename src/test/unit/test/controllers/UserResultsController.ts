import { UserResultsController } from '../../../../main/controllers/UserResultsController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { PageData } from '../../../../main/interfaces/PageData';
import { INVALID_EMAIL_FORMAT_ERROR, MISSING_EMAIL_ERROR } from '../../../../main/utils/error';
import { when } from 'jest-when';

describe('User results controller', () => {
  let req: any;
  const res = mockResponse();

  const mockApi = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    getUsersByEmail: () => {}
  };
  mockApi.getUsersByEmail = jest.fn();

  const controller = new UserResultsController();
  const email = 'john.smith@test.com';

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the user details page when searching with a valid email', async () => {
    const results = [
      {
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER']
      }
    ];
    when(mockApi.getUsersByEmail as jest.Mock).calledWith(email).mockReturnValue(results);

    req.query.email = email;
    req.scope.cradle.api = mockApi;
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('user-details', results[0]);
  });

  test('Should render the manage users page when searching with a non-existent email', async () => {
    when(mockApi.getUsersByEmail as jest.Mock).calledWith(email).mockReturnValue([]);

    req.query.email = email;
    req.scope.cradle.api = mockApi;
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('manage-users', { search: email, result: [] });
  });

  test('Should render the manage users page when more than one search results', async () => {
    const results = [
      {
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER']
      },
      {
        forename: 'J',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_ADMIN_USER']
      }
    ];
    when(mockApi.getUsersByEmail as jest.Mock).calledWith(email).mockReturnValue(results);

    req.query.email = email;
    req.scope.cradle.api = mockApi;
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('manage-users', { search: email, result: results });
  });

  test('Should render the manage users page with error when searching with empty email', async () => {
    req.query.email = '';
    await controller.get(req, res);
    const expectedPageData: PageData = {
      hasError: true,
      errorMessage: MISSING_EMAIL_ERROR
    };
    expect(res.render).toBeCalledWith('manage-users', expectedPageData);
  });

  test('Should render the manage users page with error when searching with email with invalid format', async () => {
    req.query.email = 'any text';
    await controller.get(req, res);
    const expectedPageData: PageData = {
      hasError: true,
      errorMessage: INVALID_EMAIL_FORMAT_ERROR
    };
    expect(res.render).toBeCalledWith('manage-users', expectedPageData);
  });
});
