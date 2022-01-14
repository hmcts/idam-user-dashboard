/// <reference types='codeceptjs' />
type stepsFile = typeof import('./custom-steps.js');
type IdamHelper = import('./shared/idam-helper');

declare namespace CodeceptJS {
  interface SupportObject { I: I }
  interface Methods extends Playwright, IdamHelper {}
  interface I extends ReturnType<stepsFile>, WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
