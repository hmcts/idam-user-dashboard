import { AuthedRequest } from '../interfaces/AuthedRequest';
import { NextFunction, Response } from 'express';
import { PageData } from '../interfaces/PageData';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
import autobind from 'autobind-decorator';
import { isObjectEmpty } from '../utils/utils';
import * as urls from '../utils/urls';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import * as flags from '../../main/app/feature-flags/flags';

@autobind
export class RootController {
  constructor(protected featureFlags?: FeatureFlags) {
    this.featureFlags = featureFlags;
  }

  public get(req: AuthedRequest, res: Response, view: string, data?: PageData): Promise<void> | void {
    return this.render(req, res, req.next, view, data);
  }

  public post(req: AuthedRequest, res: Response, view: string, data?: PageData): Promise<void> | void {
    return this.render(req, res, req.next, view, data);
  }

  @asyncError
  private async render(req: AuthedRequest, res: Response, next: NextFunction, view: string, data: PageData): Promise<void> {
    const constructedData: PageData = {...data, urls};

    if(this.featureFlags) {
      console.log('this.featureFlags exists')
      const featureFlags = await this.featureFlags?.getAllFlagValues();
      console.log('feature flag values exit as %j', featureFlags);
      if(!isObjectEmpty(featureFlags)) {
        constructedData.featureFlags = { values: featureFlags, flags };
      }
    }

    if(req.idam_user_dashboard_session) {
      const user = req.idam_user_dashboard_session.user;
      if(!isObjectEmpty(user)) {
        constructedData.user = user;
      }
    }

    res.render(view, constructedData);
  }
}
