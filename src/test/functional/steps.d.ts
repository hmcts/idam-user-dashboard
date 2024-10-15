/// <reference types='codeceptjs' />
type stepsFile = typeof import('./custom-steps.js');
type TestingSupportApiHelper = import('./shared/helpers/testingSupportApiHelper');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any}
  interface Methods extends Playwright, TestingSupportApiHelper {}
  interface I extends ReturnType<stepsFile>, WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {
      nonExistentMethod(): void;
    }
  }
}

