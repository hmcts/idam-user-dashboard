import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';

export class ManageUsersController extends RootController {
  public get(req: AuthedRequest, res: Response): void {
    super.get(req, res, 'manage-users');
  }
}
