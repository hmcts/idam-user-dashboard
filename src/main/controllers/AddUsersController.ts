import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';

export class AddUsersController extends RootController{
  public get(req: AuthedRequest, res: Response): void {
    super.get(req, res, 'add-users');
  }
}
