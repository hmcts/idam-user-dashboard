export interface PageData {
  error?: PageError;
  content?: PageContent;
}

export interface PageContent {
  [key: string]: string;
}

export interface PageError {
  [key: string]: {
    message: string;
  };
}
