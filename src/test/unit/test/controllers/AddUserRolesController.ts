import {when} from 'jest-when';
import { mockResponse } from '../../utils/mockResponse';
import { AddUserRolesController } from '../../../../main/controllers/AddUserRolesController';
import { mockRequest } from '../../utils/mockRequest';
import {MISSING_ROLE_ASSIGNMENT_ERROR} from '../../../../main/utils/error';
import {mockApi} from '../../utils/mockApi';
import { mockRootController } from '../../utils/mockRootController';
import { mockInviteService } from '../../utils/mockInviteService';
import { mockServiceProviderService } from '../../utils/mockServiceProviderService';
import { UserType } from '../../../../main/utils/UserType';

describe('Add user roles controller', () => {
  let req: any;
  const res = mockResponse();
  const inviteService = mockInviteService();
  const serviceProviderService = mockServiceProviderService();
  const controller = new AddUserRolesController(inviteService, serviceProviderService);
  mockRootController();

  const email = 'test@test.com';
  const forename = 'test';
  const surname = 'test';
  const role = 'test_role';
  const roleArray = ['test_role1', 'test_role2'];
  const service = {
    clientId: 'aClientID',
    hmctsAccess: {
      postActivationRedirectUrl: 'someUrl'
    }
  };

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
  });

  test('Should render the add user completion page when assigning the user with a single role', async () => {
    when(inviteService.inviteUser).mockResolvedValue({} as any);
    when(serviceProviderService.getService).mockResolvedValue(service);

    req.body._email = email;
    req.body._forename = forename;
    req.body._surname = surname;
    req.body._usertype = UserType.Professional;
    req.body.roles = role;
    req.session = {
      user: {
        id: 'some-user-id'
      }
    };

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-completion');
  });

  test('Should render the add user completion page when assigning the user with multiple roles', async () => {
    when(inviteService.inviteUser).mockResolvedValue({} as any);
    when(serviceProviderService.getService).mockResolvedValue(service);

    req.body._email = email;
    req.body._forename = forename;
    req.body._surname = surname;
    req.body.roles = roleArray;
    req.session = {
      user: {
        id: 'some-user-id'
      }
    };

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-completion');
  });

  test('Should invite user with support role redirecting to user-dashboard', async () => {
    when(inviteService.inviteUser).mockResolvedValue({} as any);
    when(serviceProviderService.getService).mockResolvedValue(service);

    req.body._email = email;
    req.body._forename = forename;
    req.body._surname = surname;
    req.body.roles = roleArray;
    req.body._usertype = UserType.Support;
    req.session = {
      user: {
        id: 'some-user-id'
      }
    };

    await controller.post(req, res);
    expect(inviteService.inviteUser).toBeCalledWith({
      email,
      forename,
      surname,
      activationRoleNames: roleArray,
      clientId: service.clientId,
      invitedBy: req.session.user.id,
      successRedirect: service.hmctsAccess.postActivationRedirectUrl,
    });
  });

  test('Should invite user with professional role without specifying redirect', async () => {
    when(inviteService.inviteUser).mockResolvedValue({} as any);
    when(serviceProviderService.getService).mockResolvedValue(service);

    req.body._email = email;
    req.body._forename = forename;
    req.body._surname = surname;
    req.body.roles = roleArray;
    req.body._userType = UserType.Professional;
    req.session = {
      user: {
        id: 'some-user-id'
      }
    };

    await controller.post(req, res);
    expect(inviteService.inviteUser).toBeCalledWith({
      email,
      forename,
      surname,
      activationRoleNames: roleArray,
      clientId: service.clientId,
      invitedBy: req.session.user.id
    });
  });

  test('Should render the add user roles page with error when no role assigned to the user', async () => {
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

    when(mockApi.getAllRoles).calledWith().mockReturnValue(allRoles);

    req.body._email = email;
    req.body._forename = forename;
    req.body._surname = surname;
    req.appSession = { user: { assignableRoles: [role2] } };

    const expectedContent = {
      user: { email: email, forename: forename, surname: surname },
      roles: [
        {
          name: 'role2',
          assignable: true
        },
        {
          name: 'role1',
          assignable: false
        }
      ]
    };
    const expectedError = { roles: {
      message: MISSING_ROLE_ASSIGNMENT_ERROR
    }};

    await controller.post(req, res);
    expect(res.render).toBeCalledWith('add-user-roles', {
      content: expectedContent,
      error: expectedError
    });
  });
});
