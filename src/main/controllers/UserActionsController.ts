import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import { User } from '../interfaces/User';

@autobind
export class UserActionsController extends RootController{
  public async post(req: AuthedRequest, res: Response) {
    const user: User = await req.scope.cradle.api.getUserById(req.body.user_id);

    switch (req.body.action) {
      case 'edit':
        this.editUser(req, res, user);
        break;
      case 'suspend':
        this.suspendUser(req, res, user);
        break;
      case 'delete':
        this.deleteUser(req, res, user);
        break;
    }
  }

  private editUser(req: AuthedRequest, res: Response, user: User) {
    const data = { user };
    return super.post(req, res, 'edit-user', { content: data });
  }

  private suspendUser(req: AuthedRequest, res: Response, user: User) {
    return super.post(req, res, 'edit-user');
  }

  private deleteUser(req: AuthedRequest, res: Response, user: User) {
    return super.post(req, res, 'edit-user');
  }
}
