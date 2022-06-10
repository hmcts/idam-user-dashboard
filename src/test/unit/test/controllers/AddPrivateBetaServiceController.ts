import { mockRequest} from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { mockRootController } from '../../utils/mockRootController';
import { mockApi } from '../../utils/mockApi';
import { AddPrivateBetaServiceController } from '../../../../main/controllers/AddPrivateBetaServiceController';
import { MISSING_PRIVATE_BETA_SERVICE_ERROR } from '../../../../main/utils/error';
import { when } from 'jest-when';
import { UserType } from '../../../../main/utils/UserType';

describe('Add private beta service controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new AddPrivateBetaServiceController();
  mockRootController();

  const email = 'test@test.com';
  const forename = 'forename';
  const surname = 'surname';

  const service1 = 'service1';
  const service2 = 'service2';
  const privateBetaRoleId = '1';
  const privateBetaRoleName = 'service-private-beta';
  const otherRoleId1 = '2';
  const otherRoleName1 = 'other-role1';
  const otherRoleId2 = '3';
  const otherRoleName2 = 'other-role2';

  const error = 'error';

  const services = [
    {
      label: service1,
      description: service1,
      onboardingRoles: [privateBetaRoleId]
    },
    {
      label: service2,
      description: service2,
      onboardingRoles: [privateBetaRoleId]
    }
  ];

  const allRoles = [
    {
      id: privateBetaRoleId,
      name: privateBetaRoleName
    },
    {
      id: otherRoleId1,
      name: otherRoleName1
    },
    {
      id: otherRoleId2,
      name: otherRoleName2
    }
  ];

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
  });

  test('Should render the add user completion page when a service is selected', async () => {
    const userRegistrationDetails = {
      email: email,
      firstName: forename,
      lastName: surname,
      roles: [UserType.Citizen, privateBetaRoleName]
    };

    when(mockApi.getAllServices).calledWith().mockReturnValue(services);
    when(mockApi.getAllRoles).calledWith().mockReturnValue(allRoles);
    when(mockApi.registerUser).calledWith(userRegistrationDetails).mockResolvedValue({});

    req.body = {
      _email: email,
      _forename: forename,
      _surname: surname,
      service: service2,
    };

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-completion');
  });

  test('Should render the add private beta service page with error when problem occurring during user registration', async () => {
    const userRegistrationDetails = {
      email: email,
      firstName: forename,
      lastName: surname,
      roles: [UserType.Citizen, privateBetaRoleName]
    };

    when(mockApi.getAllServices).calledWith().mockReturnValue(services);
    when(mockApi.getAllRoles).calledWith().mockReturnValue(allRoles);
    when(mockApi.registerUser).calledWith(userRegistrationDetails).mockReturnValue(Promise.reject(error));

    req.body = {
      _email: email,
      _forename: forename,
      _surname: surname,
      service: service2,
    };

    const expectedUser = {
      email: email,
      forename: forename,
      surname: surname
    };

    const expectedServiceSelectItems = [
      {
        value: service1,
        text: service1,
        selected: false
      },
      {
        value: service2,
        text: service2,
        selected: false
      }
    ];

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-private-beta-service', {
      content: {
        user : expectedUser,
        services: expectedServiceSelectItems,
        selectedService: service2
      },
      error: { userRegistration : { message: error } }
    });
  });

  test('Should render the add private beta service page with error when no service is selected', async () => {
    when(mockApi.getAllServices).calledWith().mockReturnValue(services);

    req.body = {
      _email: email,
      _forename: forename,
      _surname: surname,
      service: '',
    };

    const expectedUser = {
      email: email,
      forename: forename,
      surname: surname
    };

    const expectedServiceSelectItems = [
      {
        value: service1,
        text: service1,
        selected: false
      },
      {
        value: service2,
        text: service2,
        selected: false
      }
    ];

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-private-beta-service', {
      content: {
        user : expectedUser,
        services: expectedServiceSelectItems,
        selectedService: ''
      },
      error: { privateBeta : { message: MISSING_PRIVATE_BETA_SERVICE_ERROR } }
    });
  });
});
