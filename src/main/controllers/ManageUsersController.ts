import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';

export class ManageUsersController {
  public get(req: AuthedRequest, res: Response): void {
    res.render('manage-users');
  }
}
