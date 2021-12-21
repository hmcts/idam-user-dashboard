import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';

export class AddUsersController {
  public get(req: AuthedRequest, res: Response): void {
    res.render('add-users');
  }
}
