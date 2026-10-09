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
  PENDING_USER_EMAIL_ERROR,
  PENDING_USER_NO_INVITATIONS_ERROR,
  TOO_MANY_USERS_ERROR
} from '../../../../main/utils/error';
import { IdamAPI } from '../../../../main/app/idam-api/IdamAPI';
import { User } from '../../../../main/interfaces/User';
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
    mockApi.getUserById.mockReset();
    mockApi.searchUsersByEmail.mockReset();
    mockApi.searchUsersBySsoId.mockReset();
    jest.mocked(inviteService.searchInvitationByEmail).mockReset();
    jest.mocked(inviteService.searchInvitationByEmail).mockResolvedValue([]);
    jest.mocked(inviteService.searchInvitationByUserId).mockReset();
    jest.mocked(inviteService.searchInvitationByUserId).mockResolvedValue([]);
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

  test('Should trim spaces around an email entered in the search box', async () => {
    when(mockApi.searchUsersByEmail).calledWith(testToken, email).mockResolvedValue([]);

    req.body.search = `  ${email}  `;
    await controller.post(req, res);

    expect(mockApi.searchUsersByEmail).toHaveBeenCalledWith(testToken, email);
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
    expect(inviteService.searchInvitationByUserId).toHaveBeenCalledWith(userId);
    expect(inviteService.searchInvitationByEmail).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('manage-user', { error: { search: { message: NO_USER_MATCHES_ERROR + userId } } });
  });

  test('Should trim spaces around a user ID entered in the search box', async () => {
    when(mockApi.getUserById).calledWith(testToken, userId).mockRejectedValue('');
    when(mockApi.searchUsersBySsoId).calledWith(testToken, userId).mockResolvedValue([]);

    req.body.search = `  ${userId}  `;
    await controller.post(req, res);

    expect(mockApi.getUserById).toHaveBeenCalledWith(testToken, userId);
    expect(mockApi.searchUsersBySsoId).toHaveBeenCalledWith(testToken, userId);
    expect(inviteService.searchInvitationByUserId).toHaveBeenCalledWith(userId);
    expect(res.render).toHaveBeenCalledWith('manage-user', { error: { search: { message: NO_USER_MATCHES_ERROR + userId } } });
  });

  test('Should find the same invitations by email and then by their user ID when no user exists', async () => {
    const olderInvitation = {
      id: 'older-invitation-id',
      invitationType: InvitationTypes.INVITE,
      invitationStatus: InvitationStatus.EXPIRED,
      userId,
      email,
      createDate: '2026-06-02T10:00:00Z'
    };
    const newerInvitation = {
      ...olderInvitation,
      id: 'newer-invitation-id',
      invitationStatus: InvitationStatus.PENDING,
      createDate: '2026-06-03T10:00:00Z',
      lastModified: '2026-06-03T10:30:00Z'
    };
    const invitations = [olderInvitation, newerInvitation];
    const preparedInvitations = [
      {
        ...newerInvitation,
        createDate: 'Wed, 03 Jun 2026 10:00:00 GMT',
        lastModified: 'Wed, 03 Jun 2026 10:30:00 GMT'
      },
      {
        ...olderInvitation,
        createDate: 'Tue, 02 Jun 2026 10:00:00 GMT',
        lastModified: undefined
      }
    ];
    when(mockApi.searchUsersByEmail).calledWith(testToken, email).mockResolvedValue([]);
    when(inviteService.searchInvitationByEmail).calledWith(email).mockResolvedValue(invitations);
    when(mockApi.getUserById).calledWith(testToken, userId).mockRejectedValue('');
    when(mockApi.searchUsersBySsoId).calledWith(testToken, userId).mockResolvedValue([]);
    when(inviteService.searchInvitationByUserId).calledWith(userId).mockResolvedValue(invitations);

    req.body.search = email;
    await controller.post(req, res);
    expect(res.render).toHaveBeenLastCalledWith('invitation-results', {
      content: { email, invitationCount: 2, invitations: preparedInvitations }
    });
    expect(inviteService.searchInvitationByUserId).not.toHaveBeenCalled();

    req.body.search = olderInvitation.userId;
    await controller.post(req, res);

    expect(mockApi.getUserById).toHaveBeenCalledWith(testToken, userId);
    expect(mockApi.searchUsersBySsoId).toHaveBeenCalledWith(testToken, userId);
    expect(inviteService.searchInvitationByUserId).toHaveBeenCalledTimes(1);
    expect(inviteService.searchInvitationByUserId).toHaveBeenCalledWith(userId);
    expect(res.render).toHaveBeenCalledTimes(2);
    expect(res.render).toHaveBeenLastCalledWith('invitation-results', {
      content: { userId, invitationCount: 2, invitations: preparedInvitations }
    });
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('Should pass user ID invitation lookup failures to the error handler', async () => {
    const error = new Error('Invitation lookup failed');
    when(mockApi.getUserById).calledWith(testToken, userId).mockRejectedValue('');
    when(mockApi.searchUsersBySsoId).calledWith(testToken, userId).mockResolvedValue([]);
    when(inviteService.searchInvitationByUserId).calledWith(userId).mockRejectedValue(error);
    req.body.search = userId;
    req.next = jest.fn();

    await controller.post(req, res);

    expect(req.next).toHaveBeenCalledWith(error);
    expect(res.render).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
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
    expect(inviteService.searchInvitationByUserId).not.toHaveBeenCalled();
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
    expect(inviteService.searchInvitationByUserId).not.toHaveBeenCalled();
  });

  describe.each([
    { searchType: 'user ID', input: userId },
    { searchType: 'SSO ID', input: ssoId },
    { searchType: 'email', input: email }
  ])('Account found by $searchType', ({ searchType, input }) => {
    let user: Pick<User, 'id' | 'email' | 'active' | 'pending'>;

    beforeEach(() => {
      user = {
        id: userId,
        email,
        active: false,
        pending: true
      };
      req.body.search = input;

      if (searchType === 'email') {
        when(mockApi.searchUsersByEmail).calledWith(testToken, input).mockResolvedValue([user]);
      } else if (searchType === 'SSO ID') {
        when(mockApi.getUserById).calledWith(testToken, input).mockRejectedValue('');
        when(mockApi.searchUsersBySsoId).calledWith(testToken, input).mockResolvedValue([user]);
      } else {
        when(mockApi.getUserById).calledWith(testToken, input).mockResolvedValue(user);
      }
    });

    test('Should show invitations for a pending account using the returned email', async () => {
      const invitation = {
        id: 'pending-invitation-id',
        invitationType: InvitationTypes.INVITE,
        invitationStatus: InvitationStatus.PENDING,
        userId,
        email,
        createDate: '2026-06-03T10:00:00Z'
      };
      when(inviteService.searchInvitationByEmail).calledWith(email).mockResolvedValue([invitation]);

      await controller.post(req, res);

      expect(inviteService.searchInvitationByEmail).toHaveBeenCalledTimes(1);
      expect(inviteService.searchInvitationByEmail).toHaveBeenCalledWith(email);
      expect(res.render).toHaveBeenCalledTimes(1);
      expect(res.render).toHaveBeenCalledWith('invitation-results', {
        content: {
          email,
          invitationCount: 1,
          invitations: [{
            ...invitation,
            createDate: 'Wed, 03 Jun 2026 10:00:00 GMT',
            lastModified: undefined
          }]
        }
      });
      expect(res.redirect).not.toHaveBeenCalled();
      expect(inviteService.searchInvitationByUserId).not.toHaveBeenCalled();
      if (searchType === 'user ID') {
        expect(mockApi.searchUsersBySsoId).not.toHaveBeenCalled();
      }
    });

    test('Should show a pending registration message when no invitations exist', async () => {
      await controller.post(req, res);

      expect(inviteService.searchInvitationByEmail).toHaveBeenCalledWith(email);
      expect(res.render).toHaveBeenCalledTimes(1);
      expect(res.render).toHaveBeenCalledWith('manage-user', {
        error: { search: { message: PENDING_USER_NO_INVITATIONS_ERROR } }
      });
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('Should still redirect an inactive account that is not pending to user details', async () => {
      user.pending = false;

      await controller.post(req, res);

      expect(res.redirect).toHaveBeenCalledWith(307, '/user/' + userId + '/details');
      expect(inviteService.searchInvitationByEmail).not.toHaveBeenCalled();
      expect(inviteService.searchInvitationByUserId).not.toHaveBeenCalled();
      expect(res.render).not.toHaveBeenCalled();
    });
  });

  test.each([undefined, '', '   ', 'not-an-email'])('Should show an error for a pending account with an unusable email: %s', async returnedEmail => {
    when(mockApi.getUserById).calledWith(testToken, userId).mockResolvedValue({
      id: userId,
      email: returnedEmail,
      active: false,
      pending: true
    });
    req.body.search = userId;

    await controller.post(req, res);

    expect(res.render).toHaveBeenCalledWith('manage-user', {
      error: { search: { message: PENDING_USER_EMAIL_ERROR } }
    });
    expect(inviteService.searchInvitationByEmail).not.toHaveBeenCalled();
    expect(mockApi.searchUsersBySsoId).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('Should trim the returned email for a pending account selected by user ID', async () => {
    when(mockApi.getUserById).calledWith(testToken, userId).mockResolvedValue({
      id: userId,
      email: `  ${email}  `,
      active: false,
      pending: true
    });
    req.body._userId = userId;

    await controller.post(req, res);

    expect(inviteService.searchInvitationByEmail).toHaveBeenCalledWith(email);
    expect(res.render).toHaveBeenCalledWith('manage-user', {
      error: { search: { message: PENDING_USER_NO_INVITATIONS_ERROR } }
    });
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('Should pass invitation lookup failures to the error handler without redirecting a pending account', async () => {
    const error = new Error('Invitation lookup failed');
    when(mockApi.getUserById).calledWith(testToken, userId).mockResolvedValue({
      id: userId,
      email,
      active: false,
      pending: true
    });
    when(inviteService.searchInvitationByEmail).calledWith(email).mockRejectedValue(error);
    req.body.search = userId;
    req.next = jest.fn();

    await controller.post(req, res);

    expect(req.next).toHaveBeenCalledWith(error);
    expect(mockApi.searchUsersBySsoId).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.render).not.toHaveBeenCalled();
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
