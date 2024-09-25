import { Invite } from '../../../../../main/app/invite-service/Invite';
import { InviteService } from '../../../../../main/app/invite-service/InviteService';
import config from 'config';
import { when } from 'jest-when';
import { mockAxios } from '../../../utils/mockAxios';

jest.mock('config');

describe('InviteService', () => {
  const mockedAxios = mockAxios();
  const mockEndpoint = '/invites';
  when(config.get).mockReturnValue(mockEndpoint);
  when(config.get).calledWith('services.idam.appointmentMap').mockReturnValue('{ "@eJudiciary.net" : "APPOINT" }');
  const inviteService = new InviteService(mockedAxios);

  describe('inviteUser', () => {
    test('Should resolve if no error from axios', () => {
      const invite: Invite = {
        email: 'dummy@hmcts.net',
        forename: 'FORENAME',
        surname: 'SURNAME',
        clientId: 'hmcts-access',
      };

      (mockedAxios.post as jest.Mock).mockResolvedValue(true);

      expect(inviteService.inviteUser(invite)).resolves.toBe(true);
    });

    test('Should pass all data into axios request', () => {
      const invite: Invite = {
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
      const invite: Invite = {
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
      const invite: Invite = {
        email: 'dummy@hmcts.net',
        forename: 'FORENAME',
        surname: 'SURNAME',
        clientId: 'hmcts-access',
      };

      (mockedAxios.post as jest.Mock).mockRejectedValue(true);

      expect(inviteService.inviteUser(invite)).rejects.toThrow();
    });
  });
});
