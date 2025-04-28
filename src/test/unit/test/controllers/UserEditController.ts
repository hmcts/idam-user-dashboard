import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { when } from 'jest-when';
import { UserEditController } from '../../../../main/controllers/UserEditController';
import { mockRootController } from '../../utils/mockRootController';
import { mockApi } from '../../utils/mockApi';
import config from 'config';
import { IdamAPI } from '../../../../main/app/idam-api/IdamAPI';
jest.mock('config');

const setupV1User = (roleNames: string[]) => {
  return {
    id: 'test-user-id',
    forename: 'test-forename',
    surname: 'test-surname',
    email: 'test@test.local',
    active: true,
    roles: roleNames
  };
};

const convertToV2User = (user: any) => {
  return {
    id: user.id,
    forename: user.forename,
    surname: user.surname,
    email: user.email,
    active: user.active,
    roleNames: user.roles
  };
};

const setupPostData = (user: any, action: string) => {
  return {
    _userId: user.id,
    _action: action,
    id: user.id,
    forename: user.forename,
    surname: user.surname,
    email: user.email,
    roles: user.roles
  };
};

const setupPageContent = (user: any, roleAssignments: any) => {
  return {
    user: user,
    roles: roleAssignments, 
    showMfa: false,
    manageCitizenAttribute: false,
    showCitizenConflict: false 
  };
};

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

  const controller = new UserEditController(mockApi as unknown as IdamAPI);

  beforeEach(() => {
    req = mockRequest();
    req.idam_user_dashboard_session = {access_token: testToken};
  });

  test('Should render the edit user page', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'edit'),
      ssoProvider: 'azure'
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    when(config.has).calledWith('providers.azure.internalName').mockReturnValue(true);
    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));

    await controller.post(req, res);

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: setupPageContent(testUser, expectedRoleAssignments)
    });

  });

  test('Should show SSO MFA message when applicable', async () => {

    const testUser = {
      ...setupV1User(['IDAM_SUPER_USER']),
      ssoProvider: 'azure'
    };
    req.body = setupPostData(testUser, 'edit');
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    when(config.has).calledWith('providers.azure.internalName').mockReturnValue(true);
    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));

    await controller.post(req, res);

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content:  {
        ...setupPageContent(testUser, expectedRoleAssignments),
        mfaMessage: 'Managed by eJudiciary.net',
        showMfa: false
      }
    });

  });

  test('Should render the edit user page after saving when user fields changed', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      forename: 'changed-forename'
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));

    const v1UserAfterDetailsUpdate = {
      ...testUser,
      forename: 'changed-forename'
    };

    when(mockApi.editUserById).calledWith(testToken, req.body._userId, { forename: req.body.forename }).mockReturnValue(Promise.resolve(v1UserAfterDetailsUpdate));

    await controller.post(req, res);

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            forename: 'changed-forename'
          }, 
          expectedRoleAssignments
        )
      },
      notification: 'User saved successfully'
    });

  });

  test('Should render the edit user page after saving when user roles added', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      roles: ['IDAM_ADMIN_USER'],
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_ADMIN_USER'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(testUser)));

    await controller.post(req, res);

    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(testUser),
      roleNames: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER']
    });

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

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            roles: ['IDAM_SUPER_USER', 'IDAM_ADMIN_USER'],
          }, 
          expectedRoleAssignments
        )
      },
      notification: 'User saved successfully'
    });
  });

  test('Should render the edit user page after saving when user roles removed', async () => {

    const testUser = setupV1User(['IDAM_ADMIN_USER', 'IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      roles: [],
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_ADMIN_USER'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(testUser)));

    await controller.post(req, res);

    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(testUser),
      roleNames: ['IDAM_SUPER_USER']
    });

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

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            roles: ['IDAM_SUPER_USER'],
          }, 
          expectedRoleAssignments
        )
      },
      notification: 'User saved successfully'
    });

  });

  test('Should render the edit user page after saving when user roles added and removed', async () => {

    const testUser = setupV1User(['IDAM_ADMIN_USER', 'IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      roles: ['IDAM_TEST_USER'],
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_ADMIN_USER', 'IDAM_TEST_USER'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(testUser)));

    await controller.post(req, res);

    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(testUser),
      roleNames: ['IDAM_SUPER_USER', 'IDAM_TEST_USER']
    });

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

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            roles: ['IDAM_SUPER_USER', 'IDAM_TEST_USER'],
          }, 
          expectedRoleAssignments
        )
      },
      notification: 'User saved successfully'
    });

  });

  test('Should render the edit user page after saving when the requesting user adding roles to themselves', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      roles: ['IDAM_ADMIN_USER'],
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ id: testUser.id, assignableRoles: ['IDAM_ADMIN_USER'] } };

    when(mockApi.getAssignableRoles).calledWith(['IDAM_SUPER_USER', 'IDAM_ADMIN_USER']).mockReturnValue(Promise.resolve(['IDAM_ADMIN_USER', 'IDAM_TEST_USER']));

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.editUserById).calledWith(testToken, req.body._userId, { forename: req.body.forename }).mockReturnValue(Promise.resolve(testUser));

    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(testUser)));

    await controller.post(req, res);

    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(testUser),
      roleNames: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER']
    });

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

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            roles: ['IDAM_SUPER_USER', 'IDAM_ADMIN_USER'],
          }, 
          expectedRoleAssignments
        )
      },
      notification: 'User saved successfully'
    });
  });

  test('Should render the edit user page after saving when both user fields and roles changed', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      roles: ['IDAM_ADMIN_USER'],
      forename: 'changed-forename'
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER', 'IDAM_ADMIN_USER'] } };

    const v1UserAfterDetailsUpdate = {
      ...testUser,
      forename: 'changed-forename'
    };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.editUserById).calledWith(testToken, req.body._userId, { forename: req.body.forename }).mockReturnValue(Promise.resolve(v1UserAfterDetailsUpdate));

    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(v1UserAfterDetailsUpdate)));

    await controller.post(req, res);

    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(v1UserAfterDetailsUpdate),
      roleNames: ['IDAM_ADMIN_USER']
    });

    const expectedRoleAssignments = [
      {
        name: 'IDAM_ADMIN_USER',
        assignable: true,
        assigned: true
      },
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: false
      }
    ];

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            roles: ['IDAM_ADMIN_USER'],
            forename: 'changed-forename'
          }, 
          expectedRoleAssignments
        )
      },
      notification: 'User saved successfully'
    });
    
  });

  test('Should render the edit user page after saving when user mfa enabled', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER', 'idam-mfa-disabled']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      roles: ['IDAM_SUPER_USER'],
      multiFactorAuthentication: 'enabled'
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['idam-mfa-disabled'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(testUser)));

    await controller.post(req, res);


    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(testUser),
      roleNames: ['IDAM_SUPER_USER']
    });

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

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            roles: ['IDAM_SUPER_USER'],
            multiFactorAuthentication: true
          }, 
          expectedRoleAssignments
        ),
        showMfa: true, 
      },
      notification: 'User saved successfully'
    });

  });

  test('Should render the edit user page after saving when user mfa disabled', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      multiFactorAuthentication: undefined
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['idam-mfa-disabled'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(testUser)));

    await controller.post(req, res);

    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(testUser),
      roleNames: ['IDAM_SUPER_USER', 'idam-mfa-disabled']
    });

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

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            roles: ['IDAM_SUPER_USER'],
            multiFactorAuthentication: false
          }, 
          expectedRoleAssignments
        ),
        showMfa: true, 
      },
      notification: 'User saved successfully'
    });

  });

  test('Should render the edit user page after saving when user mfa enabled and a role added', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER', 'idam-mfa-disabled']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      roles: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER'],
      multiFactorAuthentication: 'enabled'
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_ADMIN_USER', 'idam-mfa-disabled'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(testUser)));

    await controller.post(req, res);

    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(testUser),
      roleNames: req.body.roles
    });

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

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            roles: ['IDAM_SUPER_USER', 'IDAM_ADMIN_USER'],
            multiFactorAuthentication: true
          }, 
          expectedRoleAssignments
        ),
        showMfa: true, 
      },
      notification: 'User saved successfully'
    });

  });
 
  test('Should render the edit user page with validation errors after saving', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      forename: '',
      surname: ''
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));

    await controller.post(req, res);

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { 
        ...setupPageContent(
          {
            ...testUser,
            forename: '',
            surname: ''
          }, 
          expectedRoleAssignments
        )
      },
      error: {
        forename: { message: 'You must enter a forename for the user' },
        surname: { message: 'You must enter a surname for the user' }
      }
    });
  });

  test('Should render the edit user page with errors when no fields changed', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save')
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
 
    await controller.post(req, res);

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content: { ...setupPageContent(testUser, expectedRoleAssignments) },
      error: {
        userEditForm: { 
          message: 'No changes to the user were made' 
        },
      }
    });
  });

  test('Should render the edit user page after there was an API issue saving user details', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      forename: 'changed-forename'
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_SUPER_USER'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.editUserById).calledWith(testToken, req.body._userId, { forename: req.body.forename }).mockReturnValue(Promise.reject());

    await controller.post(req, res);

    const expectedRoleAssignments = [
      {
        name: 'IDAM_SUPER_USER',
        assignable: true,
        assigned: true
      }
    ];

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content:  { 
        ...setupPageContent(testUser, expectedRoleAssignments)
      },
      error: {
        userEditForm: { 
          message: 'An error occurred whilst updating user ' + testUser.email 
        }
      }
    });
  });

  test('Should render the edit user page after there was an API issue saving user roles', async () => {

    const testUser = setupV1User(['IDAM_SUPER_USER']);
    req.body = {
      ...setupPostData(testUser, 'save'),
      roles: ['IDAM_ADMIN_USER']
    };
    req.idam_user_dashboard_session = { access_token: testToken, user:{ assignableRoles: ['IDAM_ADMIN_USER'] } };

    when(mockApi.getUserById).calledWith(testToken, req.body._userId).mockReturnValue(Promise.resolve(testUser));
    when(mockApi.getUserV2ById).calledWith(req.body._userId).mockReturnValue(Promise.resolve(convertToV2User(testUser)));
    when(mockApi.updateV2User).calledWith(expect.anything()).mockReturnValue(Promise.reject());

    await controller.post(req, res);

    expect(mockApi.updateV2User).toHaveBeenCalledWith({
      ...convertToV2User(testUser),
      roleNames: ['IDAM_ADMIN_USER', 'IDAM_SUPER_USER']
    });

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

    expect(res.render).toHaveBeenCalledWith('edit-user', {
      content:  { 
        ...setupPageContent(testUser, expectedRoleAssignments)
      },
      error: {
        userEditForm: { 
          message: 'An error occurred whilst updating user ' + testUser.email 
        }
      }
    });
  });
  
});
