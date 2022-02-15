export interface PageData {
  user?: PageUser;
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

export interface PageUser {
  name: string;
  email: string;
}
