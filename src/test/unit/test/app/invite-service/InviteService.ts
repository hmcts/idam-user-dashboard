import { Invite } from '../../../../../main/app/invite-service/Invite';
import { InviteService } from '../../../../../main/app/invite-service/InviteService';
import config from 'config';
import { when } from 'jest-when';
import { mockAxios } from '../../../utils/mockAxios';
import { mockLogger } from '../../../utils/mockLogger';

jest.mock('config');

describe('InviteService', () => {
  const mockedAxios = mockAxios();
  const mockedLogger = mockLogger();
  const mockEndpoint = '/invites';
  when(config.get).mockReturnValue(mockEndpoint);
  const inviteService = new InviteService(mockedAxios, mockedLogger);

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
          invitationType: 'SELF_REGISTER',
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
