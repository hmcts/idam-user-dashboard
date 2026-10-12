import { CreateInvitation, InvitationStatus, InvitationTypes } from '../../../../../main/app/invite-service/Invite';
import { InviteService } from '../../../../../main/app/invite-service/InviteService';
import config from 'config';
import { when } from 'jest-when';
import { mockAxios } from '../../../utils/mockAxios';
import { constants as http } from 'http2';

jest.mock('config');

describe('InviteService', () => {
  const mockedAxios = mockAxios();
  const mockEndpoint = '/invites';
  when(config.get).mockReturnValue(mockEndpoint);
  when(config.get).calledWith('services.idam.appointmentMap').mockReturnValue('{ "@eJudiciary.net" : "APPOINT" }');
  const inviteService = new InviteService(mockedAxios);

  describe('inviteUser', () => {
    test('Should resolve if no error from axios', () => {
      const invite: CreateInvitation = {
        email: 'dummy@hmcts.net',
        forename: 'FORENAME',
        surname: 'SURNAME',
        clientId: 'hmcts-access',
      };

      (mockedAxios.post as jest.Mock).mockResolvedValue(true);

      expect(inviteService.inviteUser(invite)).resolves.toBe(true);
    });

    test('Should pass all data into axios request', () => {
      const invite: CreateInvitation = {
        email: 'dummy@hmcts.net',
        forename: 'FORENAME',
        surname: 'SURNAME',
        clientId: 'hmcts-access',
      };

      (mockedAxios.post as jest.Mock).mockResolvedValue(true);

      inviteService.inviteUser(invite);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockEndpoint,
        {
          ...invite,
          activationRoleNames: ['citizen'],
          invitationType: 'INVITE',
        },
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
    });

    test('Should pass all data into axios request for appointed user', () => {
      const invite: CreateInvitation = {
        email: 'dummy@ejudiciary.net',
        forename: 'FORENAME',
        surname: 'SURNAME',
        clientId: 'hmcts-access',
      };

      (mockedAxios.post as jest.Mock).mockResolvedValue(true);

      inviteService.inviteUser(invite);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockEndpoint,
        {
          ...invite,
          activationRoleNames: ['citizen'],
          invitationType: 'APPOINT',
        },
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
    });

    test('Should throw INTERNAL_SERVER_ERROR if error from axios', () => {
      const invite: CreateInvitation = {
        email: 'dummy@hmcts.net',
        forename: 'FORENAME',
        surname: 'SURNAME',
        clientId: 'hmcts-access',
      };

      (mockedAxios.post as jest.Mock).mockRejectedValue(true);

      expect(inviteService.inviteUser(invite)).rejects.toMatchObject({
        status: http.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        message: 'Error sending invite to IDAM API',
      });
    });
  });

  describe('searchInvitationByUserId', () => {
    const userId = 'test-user-id';

    beforeEach(() => {
      (mockedAxios.get as jest.Mock).mockReset();
    });

    test('Should return invitations from the user ID endpoint', async () => {
      const invitations = [{
        id: 'test-invitation-id',
        userId,
        email: 'dummy@hmcts.net',
        invitationType: InvitationTypes.INVITE,
        invitationStatus: InvitationStatus.PENDING,
        createDate: '2026-06-03T10:00:00Z'
      }];
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: invitations });

      await expect(inviteService.searchInvitationByUserId(userId)).resolves.toEqual(invitations);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v2/invitations-by-user-id/test-user-id');
    });

    test('Should preserve empty results when no invitations match', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });

      await expect(inviteService.searchInvitationByUserId(userId)).resolves.toEqual([]);
    });

    test('Should encode the user ID as a path segment', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });

      await inviteService.searchInvitationByUserId('user/id?value=1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v2/invitations-by-user-id/user%2Fid%3Fvalue%3D1');
    });

    test('Should reject API failures instead of reporting no invitations', async () => {
      (mockedAxios.get as jest.Mock).mockRejectedValue(new Error('Invitation lookup failed'));

      await expect(inviteService.searchInvitationByUserId(userId)).rejects.toBe(
        'Error searching for invitation by user ID from IDAM API'
      );
    });
  });
});
