import { ManageUserController } from '../../../../main/controllers/ManageUserController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { mockRootController } from '../../utils/mockRootController';
import { mockApi } from '../../utils/mockApi';
import { when } from 'jest-when';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_INPUT_ERROR,
  NO_USER_MATCHES_ERROR,
  TOO_MANY_USERS_ERROR
} from '../../../../main/utils/error';
import { IdamAPI } from '../../../../main/app/idam-api/IdamAPI';
import { mockInviteService } from '../../utils/mockInviteService';
import { InvitationStatus, InvitationTypes } from '../../../../main/app/invite-service/Invite';

describe('Manage user controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const inviteService = mockInviteService();
  const controller = new ManageUserController(mockApi as unknown as IdamAPI, inviteService);
  const email = 'john.smith@test.com';
  const userId = '123';
  const userId2 = '234';
  const ssoId = '456';
  const testToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    req.idam_user_dashboard_session = {access_token: testToken};
  });

  test('Should render the manage user page', async () => {
    await controller.get(req, res);
    expect(res.render).toHaveBeenCalledWith('manage-user');
  });

  test('Should render the manage user page when searching with a non-existent email', async () => {
    when(mockApi.searchUsersByEmail).calledWith(testToken, email).mockReturnValue([]);

    req.body.search = email;
    await controller.post(req, res);
    expect(inviteService.searchInvitationByEmail).toHaveBeenCalledWith(email);
    expect(res.render).toHaveBeenCalledWith('manage-user', { error: { search: { message: NO_USER_MATCHES_ERROR + email } } });
  });

  test('Should render the invitation results page when searching with an email that has invitations', async () => {
    const olderInvitation = {
      id: 'older-invitation-id',
      invitationType: InvitationTypes.INVITE,
      invitationStatus: InvitationStatus.PENDING,
      userId: userId,
      email: email,
      createDate: '2026-06-02T10:00:00Z',
      lastModified: '2026-06-02T10:30:00Z'
    };
    const newerInvitation = {
      id: 'newer-invitation-id',
      invitationType: InvitationTypes.APPOINT,
      invitationStatus: InvitationStatus.PENDING,
      userId: userId,
      email: email,
      createDate: '2026-06-03T10:00:00Z',
      lastModified: '2026-06-03T10:30:00Z'
    };
    when(mockApi.searchUsersByEmail).calledWith(testToken, email).mockResolvedValue([]);
    when(inviteService.searchInvitationByEmail).calledWith(email).mockResolvedValue([olderInvitation, newerInvitation]);

    req.body.search = email;
    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('invitation-results', {
      content: {
        email,
        invitationCount: 2,
        invitations: [
          {
            ...newerInvitation,
            createDate: 'Wed, 03 Jun 2026 10:00:00 GMT',
            lastModified: 'Wed, 03 Jun 2026 10:30:00 GMT'
          },
          {
            ...olderInvitation,
            createDate: 'Tue, 02 Jun 2026 10:00:00 GMT',
            lastModified: 'Tue, 02 Jun 2026 10:30:00 GMT'
          }
        ]
      }
    });
  });

  test('Should render the manage user page when searching with a non-existent ID', async () => {
    when(mockApi.getUserById).calledWith(testToken, userId).mockRejectedValue('');
    when(mockApi.searchUsersBySsoId).calledWith(testToken, userId).mockResolvedValue([]);

    req.body.search = userId;
    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('manage-user', { error: { search: { message: NO_USER_MATCHES_ERROR + userId } } });
  });

  test('Should render the manage user page when more than one emails matches the search input', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      },
      {
        id: userId2,
        forename: 'J',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_ADMIN_USER'],
        ssoId: userId
      }
    ];
    when(mockApi.searchUsersByEmail).calledWith(testToken, email).mockResolvedValue(results);

    req.body.search = email;
    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('manage-user', { error: { search: { message: TOO_MANY_USERS_ERROR + email } } });
  });

  test('Should render the manage user page for user that matches by id', async () => {
    const testemail = 'id.match@test.local';
    const testuserid = 'test-user-id';
    const result = {
      id: testuserid,
      forename: 'John',
      surname: 'Smith',
      email: testemail,
      active: true,
      roles: ['IDAM_SUPER_USER'],
      ssoId: ssoId
    };
    when(mockApi.getUserById).calledWith(testToken, testuserid).mockResolvedValue(result);

    req.body._userId = testuserid;
    await controller.post(req, res);
    expect(res.redirect).toHaveBeenCalledWith(307, '/user/' + testuserid + '/details');
  });

  test('Should render the manage user page for one email that matches the search input', async () => {
    const localemail = 'exact.match@test.local';
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: localemail,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      }
    ];
    when(mockApi.getUserById).calledWith(testToken, userId).mockRejectedValue('');
    when(mockApi.searchUsersByEmail).calledWith(testToken, localemail).mockResolvedValue(results);

    req.body.search = localemail;
    await controller.post(req, res);
    expect(res.redirect).toHaveBeenCalledWith(307, '/user/123/details');
  });

  test('Should render the manage user page when more than one SSO IDs matches the search input', async () => {
    const results = [
      {
        id: userId,
        forename: 'John',
        surname: 'Smith',
        email: email,
        active: true,
        roles: ['IDAM_SUPER_USER'],
        ssoId: ssoId
      },
      {
        id: userId2,
        forename: 'Mike',
        surname: 'Green',
        email: email,
        active: false,
        roles: ['IDAM_ADMIN_USER'],
        ssoId: ssoId
      }
    ];
    when(mockApi.getUserById).calledWith(testToken, ssoId).mockRejectedValue('');
    when(mockApi.searchUsersBySsoId).calledWith(testToken, ssoId).mockResolvedValue(results);

    req.body.search = ssoId;
    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('manage-user', { error: { search: { message: TOO_MANY_USERS_ERROR + ssoId } } });
  });

  test('Should render the manage user page with error when searching with empty input', async () => {
    req.body.search = '';
    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('manage-user', { error: { search: { message: MISSING_INPUT_ERROR } } });
  });

  test('Should render the manage user page with error when searching with email with invalid format', async () => {
    req.body.search = 'test@test';
    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('manage-user', { error: { search: { message: INVALID_EMAIL_FORMAT_ERROR } }});
  });

});
