import { Request } from 'express';
import { TokenSet } from 'openid-client';
import { User } from './User';

export type AuthedRequest = { idam_user_dashboard_session: AppSession; } & Request;
export type AppSession = TokenSet & { user: User };
