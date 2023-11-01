import { NextFunction, Request, Response } from 'express';
import { HTTPError } from '../errors/HttpError';
import { constants as http } from 'http2';
import config from 'config';

export class FeatureFlags {
  constructor(private readonly featureFlagClient: FeatureFlagClient) {
    this.featureFlagClient = featureFlagClient;
  }

  public getFlagValue = (flagKey: string, defaultValue = false) => {
    if(config.has('featureFlags.flags.' + flagKey)) {
      const value = config.get('featureFlags.flags.' + flagKey);
      return Promise.resolve(value);
    }

    return this.featureFlagClient.getFlagValue(flagKey, defaultValue);
  };

  public getAllFlagValues = (defaultValue = false) => {
    const localFlags = config.get('featureFlags.flags') as { [key: string]: boolean };
    return this.featureFlagClient.getAllFlagValues(defaultValue)
      .then(values => {
        return { ...values, ...localFlags };
      });
  };

  public toggleRoute = (flagKey: string, defaultValue = false) => {
    return (req: Request, res: Response, next: NextFunction) => {
      this.getFlagValue(flagKey, defaultValue)
        .then(value => {
          value ? next() : next(new HTTPError(http.HTTP_STATUS_FORBIDDEN));
        })
        .catch(() => {
          next(new HTTPError(http.HTTP_STATUS_INTERNAL_SERVER_ERROR));
        });
    };
  };
}

export interface FeatureFlagClient {
  getFlagValue: (flag: string, defaultValue: boolean) => Promise<boolean>;
  getAllFlagValues: (defaultValue: boolean) => Promise<{ [flag: string]: boolean }>;
  onFlagChange: (callback: Function, defaultValue: boolean, flag?: string, ) => void;
}
