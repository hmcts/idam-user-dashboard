import { InvitationSearchStore } from '../../../main/app/invite-service/InvitationSearchStore';

export const mockInvitationSearchStore = () => {
  const mock: Partial<InvitationSearchStore> = {
    save: jest.fn().mockResolvedValue('invitation-search-id'),
    get: jest.fn()
  };

  return mock as InvitationSearchStore;
};
