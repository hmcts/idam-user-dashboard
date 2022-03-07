import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import * as urls from '../../../../main/utils/urls';
import { AddUserDetailsController } from '../../../../main/controllers/AddUserDetailsController';
import { SearchType } from '../../../../main/utils/SearchType';
import {
  duplicatedEmailError,
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_EMAIL_ERROR,
  MISSING_PRIVATE_BETA_SERVICE_ERROR,
  MISSING_USER_TYPE_ERROR,
  USER_EMPTY_FORENAME_ERROR,
  USER_EMPTY_SURNAME_ERROR
} from '../../../../main/utils/error';
import { when } from 'jest-when';
import {Service} from '../../../../main/interfaces/Service';

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
  const serviceSelectItems = [
    {
      value: serviceName,
      text: serviceName,
      selected: false
    }
  ];
  const citizenUserType = 'citizen';

  const mockApi = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    getUserDetails: () => {},
    getAllServices: async (): Promise<Service[]> => []
  };

  mockApi.getUserDetails = jest.fn();
  mockApi.getAllServices = jest.fn();

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
        user: {email: email},
        services: serviceSelectItems
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
    when(mockApi.getAllServices as jest.Mock).calledWith().mockReturnValue(services);

    req.body.forename = '';
    req.body.surname = name;
    req.body.userType = citizenUserType;
    req.body.service = serviceName;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          forename: '',
          surname: name,
          userType: citizenUserType
        },
        services: serviceSelectItems,
        selectedService: serviceName
      },
      error: { forename: {
        message: USER_EMPTY_FORENAME_ERROR
      }},
      urls
    });
  });

  test('Should render the add user details page with error when surname not populated', async () => {
    when(mockApi.getAllServices as jest.Mock).calledWith().mockReturnValue(services);

    req.body.forename = name;
    req.body.surname = '';
    req.body.userType = citizenUserType;
    req.body.service = serviceName;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          forename: name,
          surname: '',
          userType: citizenUserType
        },
        services: serviceSelectItems,
        selectedService: serviceName
      },
      error: { surname: {
        message: USER_EMPTY_SURNAME_ERROR
      }},
      urls
    });
  });

  test('Should render the add user details page with error when user type not selected', async () => {
    when(mockApi.getAllServices as jest.Mock).calledWith().mockReturnValue(services);

    req.body.forename = name;
    req.body.surname = name;
    req.body.service = '';
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          forename: name,
          surname: name,
          userType: ''
        },
        services: serviceSelectItems,
        selectedService: ''
      },
      error: { userType: {
        message: MISSING_USER_TYPE_ERROR
      }},
      urls
    });
  });

  test('Should render the add user details page with error when service for citizen user type not selected', async () => {
    when(mockApi.getAllServices as jest.Mock).calledWith().mockReturnValue(services);

    req.body.forename = name;
    req.body.surname = name;
    req.body.userType = citizenUserType;
    req.body.service = '';
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          forename: name,
          surname: name,
          userType: citizenUserType
        },
        services: serviceSelectItems,
        selectedService: ''
      },
      error: { service: {
        message: MISSING_PRIVATE_BETA_SERVICE_ERROR
      }},
      urls
    });
  });

  test('Should render the add user completion page when all fields populated', async () => {
    when(mockApi.getAllServices as jest.Mock).calledWith().mockReturnValue(services);

    req.body.forename = name;
    req.body.surname = name;
    req.body.userType = citizenUserType;
    req.body.service = serviceName;
    req.scope.cradle.api = mockApi;
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-completion', {urls});
  });
});
