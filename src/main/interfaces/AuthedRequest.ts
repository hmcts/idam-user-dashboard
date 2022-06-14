import { Request } from 'express';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { AwilixContainer } from 'awilix';
import { TokenSet } from 'openid-client';
import { User } from './User';

export type AuthedRequest = { appSession: AppSession; scope: AwilixContainer<{ api: IdamAPI }> } & Request;
export type AppSession = Express.Session & TokenSet & { user: User };
