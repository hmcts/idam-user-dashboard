import { InviteService } from '../../../main/app/invite-service/InviteService';

export const mockInviteService = () => {
  const mock: Partial<InviteService> = {
    inviteUser: jest.fn()
  };

  return mock as InviteService;
};
