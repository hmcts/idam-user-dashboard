import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { when } from 'jest-when';
import { UserEditController } from '../../../../main/controllers/UserEditController';
import { mockRootController } from '../../utils/mockRootController';
import { mockApi } from '../../utils/mockApi';
import config from 'config';
jest.mock('config');

describe('User edit controller', () => {
  mockRootController();

  let req: any;
  const res = mockResponse();
  const testToken = 'test-token';

  when(config.get).calledWith('providers.azure.internalName').mockReturnValue('azure');
  when(config.get).calledWith('providers.azure.externalName').mockReturnValue('eJudiciary.net');
  when(config.get).calledWith('providers.azure.idFieldName').mockReturnValue('eJudiciary User ID');
  when(config.get).calledWith('providers.moj.internalName').mockReturnValue('moj');
  when(config.get).calledWith('providers.moj.externalName').mockReturnValue('MOJ/Justice.gov.uk');
  when(config.get).calledWith('providers.moj.idFieldName').mockReturnValue('MOJ User ID');

  const controller = new UserEditController();

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
    req.idam_user_dashboard_session = {access_token: testToken};
  });

  test('Should render the edit user page', async () => {
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
      roles: ['IDAM_SUPER_USER']
    };

    when(mockApi.getUserById).calledWith(testToken, postData._userId).mockReturnValue(Promise.resolve(apiData));
    req.body = postData;
    req.idam_user_dashboard_session = { access_token: testToken, user: { assignableRoles: ['IDAM_SUPER_USER'] } };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    await controller.post(req, res);

    expect(mockApi.getUserById).toBeCalledWith(testToken, postData._userId);
    expect(res.render).toBeCalledWith('edit-user', { content: { user: apiData, roles: expectedRoleAssignments, showMfa: false } });
  });

  test('Should show SSO MFA message when applicable', async () => {
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
      ssoProvider: 'azure'
    };

    when(config.has).calledWith('providers.azure.internalName').mockReturnValue(true);
    when(mockApi.getUserById).calledWith(testToken, postData._userId).mockReturnValue(Promise.resolve(apiData));
    req.body = postData;
    req.idam_user_dashboard_session = { access_token: testToken, user: {assignableRoles: ['IDAM_SUPER_USER']}};

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    await controller.post(req, res);

    expect(mockApi.getUserById).toBeCalledWith(testToken, postData._userId);
    expect(res.render).toBeCalledWith('edit-user',
      {
        content: {
          user: apiData,
          roles: expectedRoleAssignments,
          showMfa: false,
          mfaMessage: 'Managed by eJudiciary.net'
        }
      });
  });

  test('Should render the edit user page after saving when user fields changed', async () => {
    const postData = {
      _userId: '7',
      _action: 'save',
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      roles: ['IDAM_SUPER_USER']
    };

    const originalUserApiData = {
      id: postData.id,
      forename: 'Tom',
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_SUPER_USER']
    };

    const updatedUserApiData = {
      id: postData.id,
      forename: postData.forename,
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_SUPER_USER'],
      multiFactorAuthentication: true
    };

    when(mockApi.getUserById).calledWith(testToken, postData._userId).mockReturnValue(Promise.resolve(originalUserApiData));
    when(mockApi.editUserById).calledWith(testToken, postData._userId, { forename: postData.forename }).mockReturnValue(Promise.resolve(updatedUserApiData));
    req.body = postData;
    req.idam_user_dashboard_session = { access_token: testToken, user: { assignableRoles: ['IDAM_SUPER_USER'] } };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    await controller.post(req, res);

    expect(mockApi.getUserById).toBeCalledWith(testToken, postData._userId);
    expect(mockApi.editUserById).toBeCalledWith(testToken, postData._userId, { forename: postData.forename });
    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: updatedUserApiData, roles: expectedRoleAssignments, showMfa: false, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page after saving when user roles added', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER']
    };

    const updatedUserData = {
      id: '7',
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      roles: ['IDAM_ADMIN_USER']
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user: { assignableRoles: ['IDAM_ADMIN_USER'] } };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(mockApi.grantRolesToUser).toBeCalledWith(testToken, originalUserData.id, [{name: 'IDAM_ADMIN_USER'}]);

    const expectedUserData = {
      id: originalUserData.id,
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      active: true,
      roles: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER'],
      multiFactorAuthentication: true
    };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_ADMIN_USER',
        assignable: true,
        assigned: true
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: false,
        assigned: true
      }
    ];

    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: expectedUserData, roles: expectedRoleAssignments, showMfa: false, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page after saving when user roles removed', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER']
    };

    const updatedUserData = {
      id: '7',
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_ADMIN_USER'] } };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(mockApi.removeRoleFromUser).toBeCalledWith(testToken, originalUserData.id, 'IDAM_ADMIN_USER');

    const expectedUserData = {
      id: originalUserData.id,
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      active: true,
      roles: ['IDAM_SUPER_USER'],
      multiFactorAuthentication: true
    };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_ADMIN_USER',
        assignable: true,
        assigned: false
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: false,
        assigned: true
      }
    ];

    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: expectedUserData, roles: expectedRoleAssignments, showMfa: false, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page after saving when user roles added and removed', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER']
    };

    const updatedUserData = {
      id: '7',
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      roles: ['IDAM_TEST_USER']
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user: { assignableRoles: ['IDAM_ADMIN_USER', 'IDAM_TEST_USER'] } };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(mockApi.grantRolesToUser).toBeCalledWith(testToken, originalUserData.id, [{name: 'IDAM_TEST_USER'}]);
    expect(mockApi.removeRoleFromUser).toBeCalledWith(testToken, originalUserData.id, 'IDAM_ADMIN_USER');

    const expectedUserData = {
      id: originalUserData.id,
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      active: true,
      roles: ['IDAM_TEST_USER', 'IDAM_SUPER_USER'],
      multiFactorAuthentication: true
    };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_ADMIN_USER',
        assignable: true,
        assigned: false
      },
      {
        name: 'IDAM_TEST_USER',
        assignable: true,
        assigned: true
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: false,
        assigned: true
      }
    ];

    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: expectedUserData, roles: expectedRoleAssignments, showMfa: false, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page after saving when the requesting user adding roles to themselves', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER']
    };

    const updatedUserData = {
      id: '7',
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      roles: ['IDAM_ADMIN_USER']
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    when(mockApi.getAssignableRoles).calledWith(['IDAM_ADMIN_USER', 'IDAM_SUPER_USER']).mockReturnValue(Promise.resolve(['IDAM_ADMIN_USER', 'IDAM_TEST_USER']));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user: { id: originalUserData.id, assignableRoles: ['IDAM_ADMIN_USER'] } };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(mockApi.grantRolesToUser).toBeCalledWith(testToken, originalUserData.id, [{name: 'IDAM_ADMIN_USER'}]);

    const expectedUserData = {
      id: originalUserData.id,
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      active: true,
      roles: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER'],
      multiFactorAuthentication: true
    };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_ADMIN_USER',
        assignable: true,
        assigned: true
      },
      {
        name: 'IDAM_TEST_USER',
        assignable: true,
        assigned: false
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: false,
        assigned: true
      }
    ];

    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: expectedUserData, roles: expectedRoleAssignments, showMfa: false, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page after saving when both user fields and roles changed', async () => {
    const postData = {
      _userId: '7',
      _action: 'save',
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      roles: ['IDAM_ADMIN_USER']
    };

    const originalUserData = {
      id: postData.id,
      forename: 'Tom',
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_SUPER_USER']
    };

    const updatedUserData = {
      id: postData.id,
      forename: postData.forename,
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_ADMIN_USER']
    };

    when(mockApi.getUserById).calledWith(testToken, postData._userId).mockReturnValue(Promise.resolve(originalUserData));
    when(mockApi.editUserById).calledWith(testToken, postData._userId, { forename: postData.forename }).mockReturnValue(Promise.resolve(updatedUserData));
    req.body = postData;
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_ADMIN_USER'] } };

    await controller.post(req, res);

    expect(mockApi.getUserById).toBeCalledWith(testToken, postData._userId);
    expect(mockApi.editUserById).toBeCalledWith(testToken, postData._userId, { forename: postData.forename });
    expect(mockApi.grantRolesToUser).toBeCalledWith(testToken, postData._userId, [{name: 'IDAM_ADMIN_USER'}]);

    const expectedUserData = {
      id: postData.id,
      forename: postData.forename,
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER'],
      multiFactorAuthentication: true
    };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_ADMIN_USER',
        assignable: true,
        assigned: true
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: false,
        assigned: true
      }
    ];

    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: expectedUserData, roles: expectedRoleAssignments, showMfa: false, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page after saving when user mfa enabled', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER', 'idam-mfa-disabled']
    };

    const updatedUserData = {
      id: '7',
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      multiFactorAuthentication: 'enabled'
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['idam-mfa-disabled'] } };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(mockApi.removeRoleFromUser).toBeCalledWith(testToken, originalUserData.id, 'idam-mfa-disabled');

    const expectedUserData = {
      id: originalUserData.id,
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      active: true,
      roles: ['IDAM_SUPER_USER'],
      multiFactorAuthentication: true
    };

    const expectedRoleAssignments = [
      {
        name: 'idam-mfa-disabled',
        assignable: true,
        assigned: false
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: false,
        assigned: true
      }
    ];

    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: expectedUserData, roles: expectedRoleAssignments, showMfa: true, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page after saving when user mfa disabled', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER']
    };

    const updatedUserData = {
      id: '7',
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['idam-mfa-disabled'] } };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(mockApi.grantRolesToUser).toBeCalledWith(testToken, originalUserData.id, [{name: 'idam-mfa-disabled'}]);

    const expectedUserData = {
      id: originalUserData.id,
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      active: true,
      roles: ['IDAM_SUPER_USER'],
      multiFactorAuthentication: false
    };

    const expectedRoleAssignments = [
      {
        name: 'idam-mfa-disabled',
        assignable: true,
        assigned: false
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: false,
        assigned: true
      }
    ];

    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: expectedUserData, roles: expectedRoleAssignments, showMfa: true, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page after saving when user mfa enabled and a role added', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER', 'idam-mfa-disabled']
    };

    const updatedUserData = {
      id: '7',
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      roles: ['IDAM_ADMIN_USER'],
      multiFactorAuthentication: 'enabled'
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_ADMIN_USER', 'idam-mfa-disabled'] } };

    await controller.post(req, res);
    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(mockApi.grantRolesToUser).toBeCalledWith(testToken, originalUserData.id, [{name: 'IDAM_ADMIN_USER'}]);
    expect(mockApi.removeRoleFromUser).toBeCalledWith(testToken, originalUserData.id, 'idam-mfa-disabled');

    const expectedUserData = {
      id: originalUserData.id,
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      active: true,
      roles: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER'],
      multiFactorAuthentication: true
    };

    const expectedRoleAssignments = [
      {
        name: 'idam-mfa-disabled',
        assignable: true,
        assigned: false
      },
      {
        name: 'IDAM_ADMIN_USER',
        assignable: true,
        assigned: true
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: false,
        assigned: true
      }
    ];

    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: expectedUserData, roles: expectedRoleAssignments, showMfa: true, 'notification': 'User saved successfully' }
    });
  });

  test('Should render the edit user page with validation errors after saving', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER']
    };

    const updatedUserData = {
      forename: '',
      surname: '',
      email: originalUserData.email
    };

    const error = {
      forename: { message: 'You must enter a forename for the user' },
      surname: { message: 'You must enter a surname for the user' }
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    await controller.post(req, res);

    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(res.render).toBeCalledWith('edit-user', {
      content: { user: {...originalUserData, ...updatedUserData}, roles: expectedRoleAssignments, showMfa: false },
      error
    });
  });

  test('Should render the edit user page with errors when no fields changed', async () => {
    const originalUserData = {
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@local.test',
      active: true,
      roles: ['IDAM_SUPER_USER']
    };

    const updatedUserData = {
      forename: originalUserData.forename,
      surname: originalUserData.surname,
      email: originalUserData.email,
      roles: ['IDAM_SUPER_USER']
    };

    const error = {
      userEditForm: { message: 'No changes to the user were made' },
    };

    when(mockApi.getUserById).calledWith(testToken, originalUserData.id).mockReturnValue(Promise.resolve(originalUserData));
    req.body = { _userId: originalUserData.id, _action: 'save', ...updatedUserData};
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    await controller.post(req, res);

    expect(mockApi.getUserById).toBeCalledWith(testToken, originalUserData.id);
    expect(res.render).toBeCalledWith('edit-user', {
      content: { user: {...originalUserData, ...updatedUserData}, roles: expectedRoleAssignments, showMfa: false },
      error
    });
  });

  test('Should render the edit user page after there was an API issue saving', async () => {
    const postData = {
      _userId: '7',
      _action: 'save',
      id: '7',
      forename: 'John',
      surname: 'Smith',
      email: 'john.smith@test.local',
      roles: ['IDAM_SUPER_USER']
    };

    const originalUserApiData = {
      id: postData.id,
      forename: 'Tom',
      surname: postData.surname,
      email: postData.email,
      active: true,
      roles: ['IDAM_SUPER_USER']
    };

    const error = {
      userEditForm: { message: 'An error occurred whilst updating user ' + postData.email },
    };

    when(mockApi.getUserById).calledWith(testToken, postData._userId).mockReturnValue(Promise.resolve(originalUserApiData));
    when(mockApi.editUserById).calledWith(testToken, postData._userId, { forename: postData.forename }).mockReturnValue(Promise.reject());
    req.body = postData;
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    await controller.post(req, res);

    expect(mockApi.getUserById).toBeCalledWith(testToken, postData._userId);
    expect(mockApi.editUserById).toBeCalledWith(testToken, postData._userId, { forename: postData.forename });
    expect(res.render).toBeCalledWith('edit-user', {
      content:  { user: originalUserApiData, roles: expectedRoleAssignments, showMfa: false },
      error
    });
  });
});
