import { Request } from 'express';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { AwilixContainer } from 'awilix';

interface Auth {
  scope: AwilixContainer<{ api: IdamAPI }>;
}

export type AuthedRequest = Auth & Request;
