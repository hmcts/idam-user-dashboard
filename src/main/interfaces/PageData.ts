import { User } from './User';
import * as flags from '../../main/app/feature-flags/flags';

export interface PageData {
  user?: Partial<User>;
  error?: PageError;
  content?: PageContent;
  featureFlags?: PageFeatureFlags;
  urls?: ServiceUrls;
}

export interface PageContent {
  [key: string]: any;
}

export interface PageFeatureFlags {
  values: {
    [key: string]: boolean;
  };
  flags: typeof flags;
}

export interface ServiceUrls {
  [key: string]: string;
}

export interface PageError {
  [key: string]: {
    message: string;
  };
}
