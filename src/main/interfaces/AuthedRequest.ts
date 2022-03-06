import { Request } from 'express';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { AwilixContainer } from 'awilix';
import { OIDCSession } from '../app/idam-auth/IdamAuth';

export type AuthedRequest = { session: AppSession; scope: AwilixContainer<{ api: IdamAPI }> } & Request;
export type AppSession = Express.Session & OIDCSession;
