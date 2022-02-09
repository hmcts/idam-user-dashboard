import { AuthedRequest } from '../types/AuthedRequest';
import { Response } from 'express';
import { PageData } from '../interfaces/PageData';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
import autobind from 'autobind-decorator';

@autobind
export class RootController {
  constructor(private featureFlags: FeatureFlags) {
    this.featureFlags = featureFlags;
  }

  public get(req: AuthedRequest, res: Response, view: string, data?: PageData): void {
    this.render(req, res, view, data);
  }

  public post(req: AuthedRequest, res: Response, view: string, data?: PageData): void {
    this.render(req, res, view, data);
  }

  private async render(req: AuthedRequest, res: Response, view: string, data: PageData): Promise<void> {
    const featureFlags = await this.featureFlags.getAllFlagValues();
    const constructedData: PageData = {...data, featureFlags};

    if (req.session?.user) {
      constructedData.user = {
        name: req.session.user.name,
        email: req.session.user.email
      };
    }

    res.render(view, constructedData);
  }
}
