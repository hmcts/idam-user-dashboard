import { Request } from 'express';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { AwilixContainer } from 'awilix';
import { User } from './User';

interface Auth {
  session:
    Express.Session &
    { user: Partial<User> & { accessToken: string; idToken: string } };
  scope: AwilixContainer<{ api: IdamAPI }>;
}

export type AuthedRequest = Auth & Request;
