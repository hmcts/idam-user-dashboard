import config from 'config';
import { when } from 'jest-when';
import { InviteService } from '../../../../../main/app/invite-service/InviteService';
import { mockAxios } from '../../../utils/mockAxios';

jest.mock('config');

describe('InviteService', () => {
  const mockEndpoint = '/invites';
  const mockClientId = 'someClientId';
  const mockedLogger = {
    error: jest.fn()
  } as any;
  const mockedTelemetryClient = { trackTrace: jest.fn() } as any;
  const mockedAxios = mockAxios();

  when(config.get).calledWith('services.idam.endpoint.invite').mockReturnValue(mockEndpoint);
  when(config.get).calledWith('services.idam.clientID').mockReturnValue(mockClientId);

  const inviteService = new InviteService(mockedAxios, mockedLogger, mockedTelemetryClient);

  describe('inviteUser', () => {
    test('Should resolve if no error from axios', () => {
      const email = 'dummy@hmcts.net';
      const forename = 'forename';
      const surname = 'surname';
      const roles = ['citizen'];
      const invitedBy = 'someUserId';
      const successRedirect = 'someUrl';

      when(mockedAxios.post).mockResolvedValue(true);

      expect(inviteService.inviteUser(email, forename, surname, roles, invitedBy, successRedirect)).resolves.toBe(true);
    });

    test('Should pass all data into axios request', () => {
      const email = 'dummy@hmcts.net';
      const forename = 'forename';
      const surname = 'surname';
      const roles = ['citizen'];
      const invitedBy = 'someUserId';
      const successRedirect = 'someUrl';

      when(mockedAxios.post).mockResolvedValue(true);

      inviteService.inviteUser(email, forename, surname, roles, invitedBy, successRedirect);

      expect(mockedAxios.post).toHaveBeenCalledWith(mockEndpoint, {
        invitationType: 'INVITE',
        clientId: mockClientId,
        email,
        forename,
        surname,
        activationRoleNames: roles,
        invitedBy,
        successRedirect
      });
    });

    test('Should throw INTERNAL_SERVER_ERROR if error from axios', () => {
      const email = 'dummy@hmcts.net';
      const forename = 'forename';
      const surname = 'surname';

      when(mockedAxios.post).mockRejectedValue(true);

      expect(inviteService.inviteUser(email, forename, surname)).rejects.toThrow();
    });
  });
});
