import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';

@autobind
export class ManageUsersController extends RootController {
  public get(req: AuthedRequest, res: Response) {
    return super.get(req, res, 'manage-users');
  }
}
