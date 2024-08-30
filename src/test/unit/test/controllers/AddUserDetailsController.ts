import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import {
  AddUserDetailsController,
  ROLE_HINT_WITH_PRIVATE_BETA,
  ROLE_HINT_WITHOUT_PRIVATE_BETA
} from '../../../../main/controllers/AddUserDetailsController';
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
import { mockRootController } from '../../utils/mockRootController';
import { mockApi } from '../../utils/mockApi';

describe('Add user details controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const controller = new AddUserDetailsController();
  const email = 'test@test.com';
  const name = 'test';
  const service1 = 'service1';
  const service2 = 'service2';

  const privateBetaRoleId = '1';
  const privateBetaRoleName = 'service-private-beta';
  const otherRoleId1 = '2';
  const otherRoleName1 = 'other-role1';
  const otherRoleId2 = '3';
  const otherRoleName2 = 'other-role2';

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

  const servicesWithPrivateBeta = [
    {
      label: service1,
      description: service1,
      onboardingRoles: [privateBetaRoleId]
    },
    {
      label: service2,
      description: service2,
      onboardingRoles: [] as string[]
    }
  ];

  const servicesWithoutPrivateBeta = [
    {
      label: service1,
      description: service1,
      onboardingRoles: [] as string[]
    },
    {
      label: service2,
      description: service2,
      onboardingRoles: [] as string[]
    }
  ];

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the add user details page when adding a non-existing user\'s email when there is no service with private beta', async () => {
    when(mockApi.searchUsersByEmail).calledWith(email).mockReturnValue([]);
    when(mockApi.getAllServices).calledWith().mockReturnValue(servicesWithoutPrivateBeta);
    when(mockApi.getAllV2Roles).calledWith().mockReturnValue(allRoles);

    req.body.email = email;
    req.idam_user_dashboard_session = { user: { assignableRoles: [UserType.Citizen] } };
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', { content: { user: { email }, showPrivateBeta: false, enablePrivateBeta: true, roleHint: ROLE_HINT_WITHOUT_PRIVATE_BETA },
    });
  });

  test('Should render the add user details page when adding a non-existing user\'s email when there is a service with private beta and the citizen role is assignable', async () => {
    when(mockApi.searchUsersByEmail).calledWith(email).mockReturnValue([]);
    when(mockApi.getAllServices).calledWith().mockReturnValue(servicesWithPrivateBeta);
    when(mockApi.getAllV2Roles).calledWith().mockReturnValue(allRoles);

    req.body.email = email;
    req.idam_user_dashboard_session = { user: { assignableRoles: [UserType.Citizen] } };
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', { content: { user: { email }, showPrivateBeta: true, enablePrivateBeta: true, roleHint: ROLE_HINT_WITH_PRIVATE_BETA },
    });
  });

  test('Should render the add user details page when adding a non-existing user\'s email when there is a service with private beta but the citizen role is not assignable', async () => {
    when(mockApi.searchUsersByEmail).calledWith(email).mockReturnValue([]);
    when(mockApi.getAllServices).calledWith().mockReturnValue(servicesWithPrivateBeta);
    when(mockApi.getAllV2Roles).calledWith().mockReturnValue(allRoles);

    req.body.email = email;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', { content: { user: { email }, showPrivateBeta: true, enablePrivateBeta: false, roleHint: ROLE_HINT_WITH_PRIVATE_BETA },
    });
  });

  test('Should render the add user page with error when adding a pre-existing user\'s email', async () => {
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
    when(mockApi.searchUsersByEmail).calledWith(email).mockReturnValue(users);

    req.body.email = email;
    req.scope.cradle.api = mockApi;

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user', {
      error: { email: {
        message: duplicatedEmailError(email)
      }},
    });
  });

  test('Should render the add user page with error when adding a user with empty email', async () => {
    req.body.email = '';
    await controller.post(req, res);

    expect(res.render).toBeCalledWith('add-user', {
      error: { email: {
        message: MISSING_EMAIL_ERROR
      }},
    });
  });

  test('Should render the add user page with error when adding a user\'s email with spaces only', async () => {
    req.body.email = '  ';
    await controller.post(req, res);

    expect(res.render).toBeCalledWith('add-user', {
      error: { email: {
        message: MISSING_EMAIL_ERROR
      }},
    });
  });

  test('Should render the add user page with error when adding a user with invalid email format', async () => {
    req.body.email = 'test@test';
    await controller.post(req, res);

    expect(res.render).toBeCalledWith('add-user', {
      error: { email: {
        message: INVALID_EMAIL_FORMAT_ERROR
      }},
    });
  });

  test('Should render the add user details page with error when forename not populated', async () => {
    req.body._email = email;
    req.body.forename = '';
    req.body.surname = name;
    req.body.userType = UserType.Support;
    req.idam_user_dashboard_session = { user: { assignableRoles: [UserType.Citizen] } };
    req.scope.cradle.api = mockApi;

    when(mockApi.getAllServices).calledWith().mockReturnValue(servicesWithoutPrivateBeta);

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          email: email,
          forename: '',
          surname: name,
          userType: UserType.Support
        },
        showPrivateBeta: false,
        enablePrivateBeta: true,
        roleHint: ROLE_HINT_WITHOUT_PRIVATE_BETA
      },
      error: { forename: {
        message: USER_EMPTY_FORENAME_ERROR
      }},
    });
  });

  test('Should render the add user details page with error when surname not populated', async () => {
    req.body._email = email;
    req.body.forename = name;
    req.body.surname = '';
    req.body.userType = UserType.Support;
    req.idam_user_dashboard_session = { user: { assignableRoles: [UserType.Citizen] } };
    req.scope.cradle.api = mockApi;

    when(mockApi.getAllServices).calledWith().mockReturnValue(servicesWithoutPrivateBeta);

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          email: email,
          forename: name,
          surname: '',
          userType: UserType.Support
        },
        showPrivateBeta: false,
        enablePrivateBeta: true,
        roleHint: ROLE_HINT_WITHOUT_PRIVATE_BETA
      },
      error: { surname: {
        message: USER_EMPTY_SURNAME_ERROR
      }},
    });
  });

  test('Should render the add user details page with error when forename and surname contain empty space only', async () => {
    req.body._email = email;
    req.body.forename = ' ';
    req.body.surname = '  ';
    req.body.userType = UserType.Support;
    req.idam_user_dashboard_session = { user: { assignableRoles: [UserType.Citizen] } };
    req.scope.cradle.api = mockApi;

    when(mockApi.getAllServices).calledWith().mockReturnValue(servicesWithPrivateBeta);

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          email: email,
          forename: '',
          surname: '',
          userType: UserType.Support
        },
        showPrivateBeta: true,
        enablePrivateBeta: true,
        roleHint: ROLE_HINT_WITH_PRIVATE_BETA
      },
      error: { forename: { message: USER_EMPTY_FORENAME_ERROR },
        surname: { message: USER_EMPTY_SURNAME_ERROR } },
    });
  });

  test('Should render the add user details page with error when user type not selected', async () => {
    req.body._email = email;
    req.body.forename = name;
    req.body.surname = name;
    req.idam_user_dashboard_session = { user: { assignableRoles: [UserType.Citizen] } };
    req.scope.cradle.api = mockApi;

    when(mockApi.getAllServices).calledWith().mockReturnValue(servicesWithPrivateBeta);

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-details', {
      content: {
        user : {
          email: email,
          forename: name,
          surname: name,
          userType: ''
        },
        showPrivateBeta: true,
        enablePrivateBeta: true,
        roleHint: ROLE_HINT_WITH_PRIVATE_BETA
      },
      error: { userType: {
        message: MISSING_USER_TYPE_ERROR
      }},
    });
  });

  test('Should render the add user completion page when all fields populated', async () => {
    when(mockApi.getAllV2Roles).calledWith().mockReturnValue(allRoles);

    req.body._email = email;
    req.body.forename = name;
    req.body.surname = name;
    req.body.userType = UserType.Professional;
    req.idam_user_dashboard_session = { user: { assignableRoles: [] } };
    req.scope.cradle.api = mockApi;

    const expectedContent = {
      roles: [
        {
          name: otherRoleName1,
          assignable: false
        },
        {
          name: otherRoleName2,
          assignable: false
        },
        {
          name: privateBetaRoleName,
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
    });
  });
});
