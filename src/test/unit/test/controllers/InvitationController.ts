import { InvitationController } from '../../../../main/controllers/InvitationController';
import { mockRootController } from '../../utils/mockRootController';
import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockInviteService } from '../../utils/mockInviteService';
import {
  INVALID_EMAIL_FORMAT_ERROR,
  NO_USER_MATCHES_ERROR
} from '../../../../main/utils/error';
import { InvitationStatus, InvitationTypes } from '../../../../main/app/invite-service/Invite';
import { mockInvitationSearchStore } from '../../utils/mockInvitationSearchStore';
import { MANAGER_USER_URL } from '../../../../main/utils/urls';

describe('Invitation controller', () => {
  mockRootController();

  let req: any;
  const res = mockResponse();
  const inviteService = mockInviteService();
  const invitationSearchStore = mockInvitationSearchStore();
  const controller = new InvitationController(inviteService, invitationSearchStore);
  const email = 'john.smith@test.com';
  const invitationSearchId = 'invitation-search-id';

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest();
    req.params = {invitationSearchId};
  });

  test('Should render invitation results when searching by stored email', async () => {
    const invitations = [
      {
        id: 'older-invitation-id',
        invitationType: InvitationTypes.INVITE,
        invitationStatus: InvitationStatus.PENDING,
        userId: 'user-id',
        email: email,
        createDate: '2026-06-02T10:00:00Z',
        lastModified: '2026-06-02T10:30:00Z'
      },
      {
        id: 'newer-invitation-id',
        invitationType: InvitationTypes.APPOINT,
        invitationStatus: InvitationStatus.PENDING,
        userId: 'user-id',
        email: email,
        createDate: '2026-06-03T10:00:00Z',
        lastModified: '2026-06-03T10:30:00Z'
      }
    ];
    invitationSearchStore.get = jest.fn().mockResolvedValue({email});
    inviteService.searchInvitationByEmail = jest.fn().mockResolvedValue(invitations);

    await controller.searchByEmailGet(req, res);

    expect(invitationSearchStore.get).toHaveBeenCalledWith(invitationSearchId);
    expect(inviteService.searchInvitationByEmail).toHaveBeenCalledWith(email);
    expect(res.render).toHaveBeenCalledWith('invitation-results', {
      content: {
        email,
        invitationCount: 2,
        invitations: [
          {
            ...invitations[1],
            createDate: 'Wed, 03 Jun 2026 10:00:00 GMT',
            lastModified: 'Wed, 03 Jun 2026 10:30:00 GMT'
          },
          {
            ...invitations[0],
            createDate: 'Tue, 02 Jun 2026 10:00:00 GMT',
            lastModified: 'Tue, 02 Jun 2026 10:30:00 GMT'
          }
        ]
      }
    });
  });

  test('Should redirect to manage user when stored search has expired', async () => {
    invitationSearchStore.get = jest.fn().mockResolvedValue(undefined);

    await controller.searchByEmailGet(req, res);

    expect(invitationSearchStore.get).toHaveBeenCalledWith(invitationSearchId);
    expect(inviteService.searchInvitationByEmail).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(MANAGER_USER_URL);
  });

  test('Should render manage user page with error when stored email is invalid', async () => {
    invitationSearchStore.get = jest.fn().mockResolvedValue({email: 'test@test'});

    await controller.searchByEmailGet(req, res);

    expect(inviteService.searchInvitationByEmail).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('manage-user', {
      error: {
        search: {message: INVALID_EMAIL_FORMAT_ERROR}
      }
    });
  });

  test('Should render manage user page with error when no invitations match the stored email', async () => {
    invitationSearchStore.get = jest.fn().mockResolvedValue({email});
    inviteService.searchInvitationByEmail = jest.fn().mockResolvedValue([]);

    await controller.searchByEmailGet(req, res);

    expect(inviteService.searchInvitationByEmail).toHaveBeenCalledWith(email);
    expect(res.render).toHaveBeenCalledWith('manage-user', {
      error: {
        search: {message: NO_USER_MATCHES_ERROR + email}
      }
    });
  });

  test('Should use the stored email and ignore request body and query string emails', async () => {
    const invitations = [
      {
        id: 'invitation-id',
        invitationType: InvitationTypes.APPOINT,
        invitationStatus: InvitationStatus.PENDING,
        userId: 'user-id',
        email: email,
        createDate: '2026-06-02T10:00:00Z'
      }
    ];
    invitationSearchStore.get = jest.fn().mockResolvedValue({email});
    inviteService.searchInvitationByEmail = jest.fn().mockResolvedValue(invitations);

    req.body.search = 'body@test.com';
    req.query.email = 'query@test.com';
    await controller.searchByEmailGet(req, res);

    expect(inviteService.searchInvitationByEmail).toHaveBeenCalledWith(email);
  });
});
