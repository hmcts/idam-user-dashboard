import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { PageData } from '../interfaces/PageData';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
import autobind from 'autobind-decorator';
import { isObjectEmpty } from '../utils/utils';

@autobind
export class RootController {
  constructor(private featureFlags?: FeatureFlags) {
    this.featureFlags = featureFlags;
  }

  public get(req: AuthedRequest, res: Response, view: string, data?: PageData): Promise<void> | void {
    return this.render(req, res, view, data);
  }

  public post(req: AuthedRequest, res: Response, view: string, data?: PageData): Promise<void> | void {
    return this.render(req, res, view, data);
  }

  private async render(req: AuthedRequest, res: Response, view: string, data: PageData): Promise<void> {
    const constructedData: PageData = {...data};

    if(this.featureFlags) {
      const featureFlags = await this.featureFlags?.getAllFlagValues();
      if(!isObjectEmpty(featureFlags)) {
        constructedData.featureFlags = featureFlags;
      }
    }

    if(req.session) {
      const user = req.session.user;
      if(!isObjectEmpty(user)) {
        constructedData.user = user;
      }
    }

    res.render(view, constructedData);
  }
}
