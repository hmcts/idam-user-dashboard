import { User } from './User';

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
  [key: string]: boolean;
}

export interface ServiceUrls {
  [key: string]: string;
}

export interface PageError {
  [key: string]: {
    message: string;
  };
}
