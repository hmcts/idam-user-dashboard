export interface PageData {
  user?: PageUser;
  error?: PageError;
  content?: PageContent;
}

export interface PageContent {
  [key: string]: any;
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
