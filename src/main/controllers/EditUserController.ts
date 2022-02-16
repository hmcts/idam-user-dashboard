import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';

@autobind
export class EditUserController extends RootController{
  public post(req: AuthedRequest, res: Response) {
    return super.post(req, res, 'edit-user');
  }
}
