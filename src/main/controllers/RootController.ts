import {AuthedRequest} from '../types/AuthedRequest';
import {Response} from 'express';
import { PageData } from '../interfaces/PageData';

export class RootController {
  public get(req: AuthedRequest, res: Response, view: string, data?: PageData): void {
    RootController.render(req, res, view, data);
  }

  public post(req: AuthedRequest, res: Response, view: string, data?: PageData): void {
    RootController.render(req, res, view, data);
  }

  private static render(req: AuthedRequest, res: Response, view: string, data: PageData): void {
    const constructedData = {
      user: {
        name: req.session.user.name,
        email: req.session.user.email
      },
      ...data
    };

    res.render(view, constructedData);
  }
}
