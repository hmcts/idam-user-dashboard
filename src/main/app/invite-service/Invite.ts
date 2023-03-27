export enum InvitationTypes {
  INVITE = 'INVITE',
  SELF_REGISTER = 'SELF_REGISTER',
  REACTIVATE = 'REACTIVATE',
}

export interface Invite {
  email: string;
  forename: string;
  surname: string;
  activationRoleNames?: string[];
  invitedBy?: string;
  clientId?: string;
  successRedirect?: string;
}
