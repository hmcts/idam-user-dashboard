import {AuthedRequest} from '../types/AuthedRequest';
import {Response} from 'express';
import { PageData } from '../interfaces/PageData';
import autobind from 'autobind-decorator';

@autobind
export class RootController {
  public get(req: AuthedRequest, res: Response, view: string, data?: PageData): void {
    this.render(req, res, view, data);
  }

  public post(req: AuthedRequest, res: Response, view: string, data?: PageData): void {
    this.render(req, res, view, data);
  }

  private render(req: AuthedRequest, res: Response, view: string, data: PageData): void {
    const constructedData: PageData = {...data};

    if(req.session?.user) {
      constructedData.user = {
        name: req.session.user.name,
        email: req.session.user.email
      };
    }

    res.render(view, constructedData);
  }
}
