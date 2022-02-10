import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';

@autobind
export class AddUsersController extends RootController{
  public get(req: AuthedRequest, res: Response) {
    return super.get(req, res, 'add-users');
  }
}
