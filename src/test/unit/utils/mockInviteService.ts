import { InviteService } from '../../../main/app/invite-service/InviteService';

export const mockInviteService = () => {
  const mock: Partial<InviteService> = {
    inviteUser: jest.fn((): any => {
      console.log('USER INVITED');
    })
  };

  return mock as InviteService;
};
