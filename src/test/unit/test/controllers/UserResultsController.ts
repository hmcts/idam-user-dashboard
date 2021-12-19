import { UserResultsController } from '../../../../main/controllers/UserResultsController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { PageData } from '../../../../main/interfaces/PageData';
import { invalidEmailFormat, missingEmail } from '../../../../main/utils/error';
import { when } from 'jest-when';

describe('User results controller', () => {
  let req: any;
  const res = mockResponse();
  // const mockApi = {
  //   get: () => []
  // };

  const controller = new UserResultsController();

  beforeEach(() => {
    req = mockRequest();
  });

  // TO DO - this test needs to be updated once the search for user functionality is implemented
  // test('Should render the user details page when searching with a valid email', async () => {
  //
  //   const email = 'john.smith@test.com';
  //   const results = [
  //     {
  //       forename: 'John',
  //       surname: 'Smith',
  //       email: email,
  //       active: true,
  //       roles: 'IDAM_SUPER_USER'
  //     }
  //   ];
  //
  //   when(mockApi.get as jest.Mock).calledWith().mockReturnValue(results);
  //   // const api: any = {
  //   //   getUsersByEmail: async () => response.data,
  //   // };
  //   // const controller = new UserResultsController(api);
  //
  //   req.query.email = email;
  //   req.scope.cradle.api = mockApi;
  //   // res.data = results;
  //   await controller.get(req, res);
  //   expect(res.render).toBeCalledWith('user-details');
  // });

  test('Should render the manage users page with error when searching with empty email', async () => {
    req.query.email = '';
    await controller.get(req, res);
    const expectedPageData: PageData = {
      hasError: true,
      errorMessage: missingEmail
    };
    expect(res.render).toBeCalledWith('manage-users', expectedPageData);
  });

  test('Should render the manage users page with error when searching with email with invalid format', async () => {
    req.query.email = 'any text';
    await controller.get(req, res);
    const expectedPageData: PageData = {
      hasError: true,
      errorMessage: invalidEmailFormat
    };
    expect(res.render).toBeCalledWith('manage-users', expectedPageData);
  });
});
