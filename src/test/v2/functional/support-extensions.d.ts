declare namespace CodeceptJS {
  interface SupportObject {
    login: (name: string) => Promise<void> | void;
  }
}
