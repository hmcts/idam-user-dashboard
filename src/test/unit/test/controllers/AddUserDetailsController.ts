import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import * as urls from '../../../../main/utils/urls';
import { AddUserDetailsController } from '../../../../main/controllers/AddUserDetailsController';
import { SearchType } from '../../../../main/utils/SearchType';
import {
  duplicatedEmailError,
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_EMAIL_ERROR
} from '../../../../main/utils/error';
import { when } from 'jest-when';

describe('Add user details controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new AddUserDetailsController();
  const email = 'test@test.com';

  const mockApi = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    getUserDetails: () => {}
  };
  mockApi.getUserDetails = jest.fn();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the add user details page when adding a non-existing user', async () => {
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType['Email'], email).mockReturnValue([]);

    req.body.email = email;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: { email: email },
      urls
    });
  });

  test('Should render the add users page with error when adding a pre-existing user', async () => {
    const users = [
      {
        id: '123',
        forename: 'test',
        surname: 'test',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER']
      }
    ];
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType['Email'], email).mockReturnValue(users);

    req.body.email = email;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-users', {
      error: { email: {
        message: duplicatedEmailError(email)
      }},
      urls
    });
  });

  test('Should render the add users page with error when adding a user with empty email', async () => {
    req.body.email = '';
    await controller.post(req, res);

    expect(res.render).toBeCalledWith('add-users', {
      error: { email: {
        message: MISSING_EMAIL_ERROR
      }},
      urls
    });
  });

  test('Should render the add users page with error when adding a user with invalid email format', async () => {
    req.body.email = 'test@test';
    await controller.post(req, res);

    expect(res.render).toBeCalledWith('add-users', {
      error: { email: {
        message: INVALID_EMAIL_FORMAT_ERROR
      }},
      urls
    });
  });
});
