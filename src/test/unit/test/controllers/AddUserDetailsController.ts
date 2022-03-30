import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import * as urls from '../../../../main/utils/urls';
import { AddUserDetailsController } from '../../../../main/controllers/AddUserDetailsController';
import { SearchType } from '../../../../main/utils/SearchType';
import {
  duplicatedEmailError,
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_EMAIL_ERROR,
  MISSING_USER_TYPE_ERROR,
  USER_EMPTY_FORENAME_ERROR,
  USER_EMPTY_SURNAME_ERROR
} from '../../../../main/utils/error';
import { when } from 'jest-when';
import { UserType } from '../../../../main/utils/UserType';

describe('Add user details controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new AddUserDetailsController();
  const email = 'test@test.com';
  const name = 'test';
  const serviceName = 'service';
  const services = [
    {
      label: serviceName,
      description: serviceName,
      onboardingRoles: ['private-beta']
    }
  ];

  const mockApi = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    getUserDetails: jest.fn(),
    getAllRoles: jest.fn(),
    getAllServices: jest.fn()
  };

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the add user details page when adding a non-existing user\'s email', async () => {
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.Email, email).mockReturnValue([]);
    when(mockApi.getAllServices as jest.Mock).calledWith().mockReturnValue(services);

    req.body.email = email;
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user: {email: email}
      },
      urls
    });
  });

  test('Should render the add users page with error when adding a pre-existing user\'s email', async () => {
    const users = [
      {
        id: '123',
        forename: name,
        surname: name,
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER']
      }
    ];
    when(mockApi.getUserDetails as jest.Mock).calledWith(SearchType.Email, email).mockReturnValue(users);

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

  test('Should render the add users page with error when adding a user\'s email with spaces only', async () => {
    req.body.email = '  ';
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

  test('Should render the add user details page with error when forename not populated', async () => {
    req.body._email = email;
    req.body.forename = '';
    req.body.surname = name;
    req.body.userType = UserType.Support;
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          email: email,
          forename: '',
          surname: name,
          userType: UserType.Support
        }
      },
      error: { forename: {
        message: USER_EMPTY_FORENAME_ERROR
      }},
      urls
    });
  });

  test('Should render the add user details page with error when surname not populated', async () => {
    req.body._email = email;
    req.body.forename = name;
    req.body.surname = '';
    req.body.userType = UserType.Support;
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          email: email,
          forename: name,
          surname: '',
          userType: UserType.Support
        }
      },
      error: { surname: {
        message: USER_EMPTY_SURNAME_ERROR
      }},
      urls
    });
  });

  test('Should render the add user details page with error when forename and surname contain empty space only', async () => {
    req.body._email = email;
    req.body.forename = ' ';
    req.body.surname = '  ';
    req.body.userType = UserType.Support;
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          email: email,
          forename: '',
          surname: '',
          userType: UserType.Support
        }
      },
      error: { forename: { message: USER_EMPTY_FORENAME_ERROR },
        surname: { message: USER_EMPTY_SURNAME_ERROR } },
      urls
    });
  });

  test('Should render the add user details page with error when user type not selected', async () => {
    req.body._email = email;
    req.body.forename = name;
    req.body.surname = name;
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          email: email,
          forename: name,
          surname: name,
          userType: ''
        }
      },
      error: { userType: {
        message: MISSING_USER_TYPE_ERROR
      }},
      urls
    });
  });

  test('Should render the add user completion page when all fields populated', async () => {
    const role1 = 'role1';
    const role2 = 'role2';

    const allRoles = [
      {
        id: 1,
        name: role1,
        description: role1,
        assigned: false
      },
      {
        id: 2,
        name: role2,
        description: role2,
        assigned: false
      }
    ];

    when(mockApi.getAllRoles as jest.Mock).calledWith().mockReturnValue(allRoles);

    req.body._email = email;
    req.body.forename = name;
    req.body.surname = name;
    req.body.userType = UserType.Professional;
    req.session = { user: { assignableRoles: [] } };
    req.scope.cradle.api = mockApi;

    const expectedContent = {
      roles: [
        {
          name: 'role1',
          assignable: false
        },
        {
          name: 'role2',
          assignable: false
        }
      ],
      user: {
        email: email,
        forename: name,
        surname: name,
        userType: UserType.Professional
      }
    };

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-roles', {
      content: expectedContent,
      urls,
      user: { assignableRoles: [] }
    });
  });
});
